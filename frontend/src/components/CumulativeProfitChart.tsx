import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { PositionSummary } from "../lib/tradeUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CumulativeProfitChartProps {
  positions: PositionSummary[];
}

const CumulativeProfitChart: React.FC<CumulativeProfitChartProps> = ({
  positions,
}) => {
  // Filter for closed positions and sort them by their last exit date
  const sortedPositions = [...positions]
    .filter((p) => p.status === "Closed")
    .sort((a, b) => {
      const lastExitA = Math.max(
        ...a.tradesInPosition
          .filter((t) => t.exit_date)
          .map((t) => new Date(t.exit_date!).getTime())
      );
      const lastExitB = Math.max(
        ...b.tradesInPosition
          .filter((t) => t.exit_date)
          .map((t) => new Date(t.exit_date!).getTime())
      );
      return lastExitA - lastExitB;
    });

  let cumulativeProfit = 0;
  const chartData: ChartData<"line"> = {
    labels: ["Início"],
    datasets: [
      {
        label: "Lucro Acumulado",
        data: [0],
        fill: true,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  sortedPositions.forEach((position, index) => {
    cumulativeProfit += Number(position.totalRealizedProfit);
    chartData.labels!.push(`Trade ${index + 1}`);
    (chartData.datasets[0].data as number[]).push(cumulativeProfit);
  });

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: window.innerWidth < 640 ? 12 : 14,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Lucro Acumulado: R$ ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false, // Allow negative start
        ticks: {
          callback: function (value) {
            return (
              "R$ " + (typeof value === "number" ? value.toFixed(2) : value)
            );
          },
          font: {
            size: window.innerWidth < 640 ? 10 : 12,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 10 : 12,
          },
          maxTicksLimit: window.innerWidth < 640 ? 5 : 10,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  if (sortedPositions.length === 0) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg border">
        <div className="flex items-center justify-center h-40 sm:h-64 text-gray-500">
          <p className="text-sm sm:text-base">
            Nenhum trade fechado para exibir o gráfico
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border">
      <div className="h-40 sm:h-64 md:h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CumulativeProfitChart;
