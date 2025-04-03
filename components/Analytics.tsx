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
import "../css/Analytics.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [monthlyReports, setMonthlyReports] = useState<number[]>(new Array(12).fill(0));
  const [claimsSuccessRate, setClaimsSuccessRate] = useState<number[]>(new Array(12).fill(0));
  const chartRefs = useRef<{ monthly: ChartJS | null; success: ChartJS | null }>({
    monthly: null,
    success: null,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const monthLabels = useMemo(() => {
    return isMobile
      ? ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }, [isMobile]);

  const getFontSize = (min: number, preferredFactor: number, max: number): number => {
    const calculatedSize = window.innerWidth / preferredFactor;
    return Math.min(max, Math.max(min, calculatedSize));
  };

  const monthlyReportOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 30,
          ticks: {
            stepSize: 10,
            font: {
              size: getFontSize(8, 100, 14), 
          },
        },
          grid: {
            drawBorder: true,  
            drawOnChartArea: true,
            drawTicks: false, 
          },
        },
        x: {
          stacked:true,
          barPercentage: 0.9, 
          categoryPercentage: 0.9,
          grid: {
            drawBorder: true, 
            drawOnChartArea: false, 
            drawTicks: true, 
          },
          ticks: {
            font:{
              size: getFontSize(8, 100, 14), 
            },
           },

        },
      },
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: { enabled: true },
      },
    }),
    [window.innerWidth]
  );




  const successRateOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          stacked: true,
          grid: {
            drawBorder: true,  
            drawOnChartArea: true,
            drawTicks: false, 
          },
          beginAtZero: true,
          max: Math.max(...claimsSuccessRate, 100),
          ticks: {
            stepSize: 25,
            font: {
              size: getFontSize(8, 100, 14), 
          }
        },
          title: { display: false},
        },
        x: {
          stacked: true, 
          grid: {
            drawBorder: true, 
            drawOnChartArea: false, 
            drawTicks: true, 
          },
          ticks:{
            font: {
              size: getFontSize(8, 100, 14), 
            }
          },
        },
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

   const onChartUpdate = (chartRefKey: "monthly" | "success", chartInstance: ChartJS | null) => {
    if (chartRefs.current[chartRefKey]) {
      chartRefs.current[chartRefKey]!.destroy(); 
    }
    chartRefs.current[chartRefKey] = chartInstance;
  };

  return (
    <div className="container justify-content-evenly pt-4 d-flex flex-lg-row flex-column" style={{
      width:'100%'
    }}>
      {/* Monthly Reports */}
      <div className="pbar-div mb-5 mt-4 ">
        <h2 className="text-start mb-3 fw-bold" style={{
           fontFamily: "DM Sans, sans-serif",
           fontSize:'clamp(12px, 1.4rem, 30px)',
           color:'#212020', 
        }}>Monthly Item Reports</h2>
      <div className="graph-div mt-2 p-lg-5 p-3">  
        <Bar className="bar-graph p-0" 
          ref={(chartInstance) => chartInstance && onChartUpdate("monthly", chartInstance)}
          data={{
            labels: monthLabels,
            datasets: [
              {
                label: "Item Reports",
                data: monthlyReports.map((value, index) => {
                  return index === new Date().getMonth() ? 0 : value; // Exclude the current month
                }),
                backgroundColor: (context) => {
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return;
        
                  const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.bottom);
                  gradient.addColorStop(0, "#92e9fd");
                  gradient.addColorStop(1, "#004097");
        
                  return gradient;
                },
              },
              {
                label: "Current Month",
                data: monthlyReports.map((value, index) => {
                  return index === new Date().getMonth() ? value : 0; // Show only the current month
                }),
                backgroundColor: "#e8a627", // Different color for the current month
              },
            ],
          }}
          options={monthlyReportOptions}
        />
      </div>
      </div>

      {/* Success Rate */}
      <div className="mb-5 pbar-div mt-4">
        <h2 className="text-start fw-bold mb-3"
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize:'clamp(12px, 1.4rem, 30px)',
          color:'#212020', 
       }}
        >Success Rate of Item Claims</h2>
        <div className="graph-div mt-2 p-lg-5 p-3">
        <Bar className="bar-graph p-0"
          ref={(chartInstance) => chartInstance && onChartUpdate("success", chartInstance)}
          data={{
            labels: monthLabels,
            datasets: [
              {
                label: "Success Rate (%)",
                data: claimsSuccessRate,
                backgroundColor: "#67d753",
              },
              {
                label: "Items Reports",
                data: monthlyReports,
                backgroundColor: "rgba(54, 162, 235, 1)",
              },
            ],
          }}
          options={successRateOptions}
        />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
