import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useEffect, useState, useMemo, useRef } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../src/firebase";

// ✅ Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [monthlyReports, setMonthlyReports] = useState<number[]>(new Array(12).fill(0));
  const [claimsSuccessRate, setClaimsSuccessRate] = useState<number[]>(new Array(12).fill(0));
  const chartRefs = useRef<{ monthly: ChartJS | null; success: ChartJS | null }>({
    monthly: null,
    success: null,
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const reportsSnapshot = await getDocs(collection(db, "lost_items"));
        const claimSnapshot = await getDocs(collection(db, "claim_items"));

        const reportData = new Array(12).fill(0);
        const claimData = new Array(12).fill(0);

        reportsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "approved" && data.date) {
            const monthIndex = new Date(data.date).getMonth();
            reportData[monthIndex]++;
          }
        });

        claimSnapshot.forEach((doc) => {
          const claimanalytics = doc.data();
          if (claimanalytics.status === "claimed" && claimanalytics.date) {
            const monthIndex = new Date(claimanalytics.date).getMonth();
            claimData[monthIndex]++;
          }
        });

        setMonthlyReports(reportData);

        const successRate = reportData.map((reportCount, index) =>
          reportCount === 0 ? 0 : Math.min(100, Math.round((claimData[index] / reportCount) * 100))
        );

        setClaimsSuccessRate(successRate);
      } catch (error) {
        console.error("🔥 Error fetching data for charts:", error);
      }
    };

    fetchReportData();
  }, []);

  const monthlyReportOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 30,
          ticks: { stepSize: 10 },
        },
      },
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: { enabled: true },
      },
    }),
    []
  );

  const successRateOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          stacked: true,
          beginAtZero: true,
          suggestedMax: Math.max(...monthlyReports, 100),
          ticks: { stepSize: 10 },
          title: { display: true, text: "Reports & Success Rate" },
        },
        x: { stacked: true },
      },
      plugins: {
        legend: { display: true, position: "top" as const },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (tooltipItem) {
              const datasetLabel = tooltipItem.dataset.label || "";
              const value = tooltipItem.raw;
              return datasetLabel.includes("Success Rate") ? `${datasetLabel}: ${value}%` : `${datasetLabel}: ${value}`;
            },
          },
        },
      },
    }),
    [monthlyReports]
  );

  // Function to destroy previous chart instance before rendering a new one
  const onChartUpdate = (chartRefKey: "monthly" | "success", chartInstance: ChartJS | null) => {
    if (chartRefs.current[chartRefKey]) {
      chartRefs.current[chartRefKey]!.destroy(); // Destroy previous instance
    }
    chartRefs.current[chartRefKey] = chartInstance;
  };

  return (
    <div className="container">
      {/* Monthly Reports */}
      <div className="mb-4">
        <h2 className="text-start mb-3">Monthly Item Reports</h2>
        <Bar
          ref={(chartInstance) => chartInstance && onChartUpdate("monthly", chartInstance)}
          data={{
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
              {
                label: "Item Reports",
                data: monthlyReports,
                backgroundColor: "rgba(54, 162, 235, 1)",
              },
            ],
          }}
          options={monthlyReportOptions}
        />
      </div>

      {/* Success Rate */}
      <div className="mb-4">
        <h2 className="text-start mb-3">Success Rate of Item Claims</h2>
        <Bar
          ref={(chartInstance) => chartInstance && onChartUpdate("success", chartInstance)}
          data={{
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
              {
                label: "Success Rate (%)",
                data: claimsSuccessRate,
                backgroundColor: "rgba(75, 192, 192, 1)",
              },
              {
                label: "Lost Items (Reports)",
                data: monthlyReports,
                backgroundColor: "rgba(54, 162, 235, 1)",
              },
            ],
          }}
          options={successRateOptions}
        />
      </div>
    </div>
  );
};

export default Analytics;
