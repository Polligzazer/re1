import { useEffect, useState } from 'react';
import { onSnapshot, collection, where, query, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase';

type Hotspot = {
  location: string;
  count: number;
  sections: Record<string, number>;
  roles: Set<string>;
};

const normalizeLocation = (raw: string): string => {
  const lower = raw.toLowerCase().trim();

  const roomMatch = lower.match(/room\s?\d+[a-z]?/i);
  if (roomMatch) return capitalizeWords(roomMatch[0]);

  const hallwayMatch = lower.match(/hallway\s?[a-z]/i);
  if (hallwayMatch) return capitalizeWords(hallwayMatch[0]);

  const physicsMatch = lower.match(/(physics\s?lab|phy\s?lab)\s/i);
  if (physicsMatch) return capitalizeWords(physicsMatch[0]);

  const chemMatch = lower.match(/hallway\s?[a-z]/i);
  if (chemMatch) return capitalizeWords(chemMatch[0]);

  const kitchenMatch = lower.match(/kitchen/i);
  if (kitchenMatch) return capitalizeWords(kitchenMatch[0]);

  const libraryMatch = lower.match(/library/i);
  if (libraryMatch) return capitalizeWords(libraryMatch[0]);

  if (lower.includes('cafeteria') || lower.includes('canteen')) return 'Cafeteria';
  if (lower.includes('amphitheater') || lower.includes('amphi')) return 'Amphitheater';
  if (lower.includes('library')) return 'Amphitheater';

  const labMatch = lower.match(/(computer\s?lab|com\s?lab|lab)\s?(a|b)/i);
  if (labMatch) {return `Computer Lab ${labMatch[2].toUpperCase()}`;}

  return capitalizeWords(lower.split(' ').slice(0, 2).join(' '));
};

const capitalizeWords = (input: string): string =>
  input.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const getHotspotLevel = (count: number): string => {
  if (count >= 10) return 'High';
  if (count >= 5) return 'Medium';
  return 'Low';
};
const ItemHotspots: React.FC = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  useEffect(() => {
    const fetchUsersAndReports = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const userMap = new Map<string, { role: string; section: string }>();
      usersSnap.forEach(doc => {
        const user = doc.data();
        const strand = user.strandOrCourse || 'Unknown';
        const yearSec = user.yearSection || 'Unknown';
        userMap.set(doc.id, {
          role: user.role || 'Unknown',
          section: `${strand} ${yearSec}`,
        });
      });
  
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
  
      const approvedQuery = query(
        collection(db, 'lost_items'),
        where('status', '==', 'approved'),
        where('timestamp', '>=', startOfMonth)
      );
  
      const unsubscribe = onSnapshot(approvedQuery, snapshot => {
        const map: Record<string, Hotspot> = {};
  
        snapshot.forEach(doc => {
          const data = doc.data();
          const rawLocation = data.location?.trim() || 'Unknown';
          const normalized = normalizeLocation(rawLocation);
          const userId = data.userId;
  
          const user = userMap.get(userId) || { role: 'Unknown', section: 'Unknown' };
  
          if (!map[normalized]) {
            map[normalized] = {
              location: normalized,
              count: 0,
              sections: {},
              roles: new Set(),
            };
          }
  
          const hotspot = map[normalized];
          hotspot.count += 1;
          hotspot.roles.add(user.role);
          hotspot.sections[user.section] = (hotspot.sections[user.section] || 0) + 1;
        });
  
        const sorted = Object.values(map).sort((a, b) => b.count - a.count);
        setHotspots(sorted);
      });
  
      return () => unsubscribe();
    };
  
    fetchUsersAndReports();
  }, []);

  return (
    <div className="container my-4">
      <h2 className="h4 mb-3">Lost Item Hotspots</h2>
      <table className="table table-bordered table-hover">
        <thead className="table-light text-center">
          <tr>
            <th>Location</th>
            <th>Hotspot Level</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {hotspots.map((hotspot, index) => (
            <tr key={index}>
              <td>{hotspot.location}</td>
              <td>{getHotspotLevel(hotspot.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemHotspots;
