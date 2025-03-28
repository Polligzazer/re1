import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../src/firebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { ChartOptions } from "chart.js";

// Register chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthlyRep: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    y: {
      beginAtZero: true,
      suggestedMax: 30,
      ticks: {
        stepSize: 10 // Ensures the scale increments correctly
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: "top"
    },
    tooltip: {
      enabled: true
    }
  }
};
const Successrt: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    y: {
      beginAtZero: true,
      suggestedMax: 100,
      ticks: {
        stepSize: 25 // Ensures the scale increments correctly
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: "top"
    },
    tooltip: {
      enabled: true
    }
  }
};


const Analytics = () => {
  const [monthlyReports, setMonthlyReports] = useState<number[]>(new Array(12).fill(0));
  const [claimsSuccessRate, setClaimsSuccessRate] = useState<number[]>(new Array(12).fill(0));

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const reportsSnapshot = await getDocs(collection(db, "lost_items"));

        const reportData = new Array(12).fill(0); // Initialize monthly report counts
        const claimData = new Array(12).fill(0);  // Initialize successful claim counts

        reportsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "approved") { // ✅ Filter for approved reports only
            const reportDate = data.date;
            if (reportDate) {
              const monthIndex = new Date(reportDate).getMonth();
              reportData[monthIndex]++;
            }
          }
          if (data.status === "claimed") { // ✅ Claimed items for success rate
            const claimDate = data.date;
            if (claimDate) {
              const monthIndex = new Date(claimDate).getMonth();
              claimData[monthIndex]++;
            }
          }
        });
        setMonthlyReports(reportData);

        // Calculate success rate per month
        const successRate = reportData.map((reportCount, index) => {
          return reportCount === 0
            ? 0
            : Math.round((claimData[index] / reportCount) * 100); // Calculate percentage
        });

        setClaimsSuccessRate(successRate);
        } catch (error) {
        console.error("🔥 Error fetching data for charts:", error);
        }
        };

        fetchReportData();
        }, []);

  return (
    <div className="container">
      <div className="mb-4">
        <h2 className="text-start mb-3">Monthly Item Reports</h2>
        <Bar
          data={{
            labels: [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ],
            datasets: [
              {
                label: "Item Reports",
                data: monthlyReports,
                backgroundColor: "rgba(54, 162, 235, 0.6)"
              }
            ]
          }}
          options={MonthlyRep} 
        />
      </div>

      {/* Success Rate Bar Graph */}
      <div className="mb-4">
        <h2 className="text-start mb-3">Success Rate of Item Claims</h2>
        <Bar
          data={{
            labels: [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ],
            datasets: [
              {
                label: "Success Rate (%)",
                data: claimsSuccessRate,
                backgroundColor: "rgba(75, 192, 192, 0.6)"
              }
            ]
          }}
          options={Successrt} 
        />
      </div>
    </div>
  );
};

export default Analytics;
