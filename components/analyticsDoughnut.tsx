import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const AnalyticsDoughnut = ({ percentage }: { percentage: number }) => {
  const remaining = 100 - percentage;
  // Set color based on match quality
  const getMatchColor = (value: number) => {
    if (value >= 75) return "#4caf50"; // green - high
    if (value >= 40) return "#ffc107"; // amber - medium
    return "#f44336"; // red - low
  };

  const data = {
    datasets: [
      {
        data: [percentage, remaining],
        backgroundColor: [getMatchColor(percentage), "#e0e0e0"],
        borderWidth: 0,
        cutout: "75%",
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
    },
  };

  return (
    <div style={{
      width: 160,
      height: 160,
      borderRadius: "50%",
      border: "6px solid #f0f0f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}>
      <Doughnut data={data} options={options} />
      <div style={{
        position: "absolute",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#333",
        lineHeight: "1.2"
      }}>
        {percentage}%
        <br />
      </div>
    </div>
  );
};

export default AnalyticsDoughnut;
