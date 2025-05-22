import { Timestamp } from "firebase/firestore";

export type Item = {
  id: string;
  reportId: string;   
  item: string;       
  category: string;
  description: string;
  location: string;
  date: string;
  imageUrl?: string;
  userId: string;
  type: string;
};
export type ClaimItem = {
  id: string;
  claimantName: string;
  itemName: string;
  claimedDate: Timestamp;
  userId: string;
  imageUrl?: string;
  status: string;
  category: string;
  description: string;
  location: string;
  referencePostId?: string;
  date: string;
};
