"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "next-themes";
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
import { Position } from "@/types/trade";

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
  positions: Position[];
}

const CumulativeProfitChart: React.FC<CumulativeProfitChartProps> = ({
  positions,
}) => {
  const { theme } = useTheme();
  const [fontSize, setFontSize] = React.useState(14);
  const [maxTicksLimit, setMaxTicksLimit] = React.useState(10);

  React.useEffect(() => {
    const isMobile = window.innerWidth < 640;
    setFontSize(isMobile ? 12 : 14);
    setMaxTicksLimit(isMobile ? 5 : 10);
  }, []);

  // Filter for closed positions and sort them by their last exit date
  const sortedPositions = [...positions]
    .filter((p) => p.status === "Closed" && p.last_exit_date)
    .sort(
      (a, b) =>
        new Date(a.last_exit_date!).getTime() -
        new Date(b.last_exit_date!).getTime()
    );

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
    cumulativeProfit += Number(position.total_realized_pnl);
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
          color: theme === "dark" ? "#f8fafc" : "#0f172a",
          usePointStyle: true,
          padding: 20,
          font: {
            size: fontSize,
          },
        },
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
          color: theme === "dark" ? "#cbd5e1" : "#475569",
          callback: function (value) {
            return (
              "R$ " + (typeof value === "number" ? value.toFixed(2) : value)
            );
          },
          font: {
            size: fontSize,
          },
        },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        ticks: {
          color: theme === "dark" ? "#cbd5e1" : "#475569",
          font: {
            size: fontSize,
          },
          maxTicksLimit: maxTicksLimit,
        },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  if (sortedPositions.length === 0) {
    return (
      <div className="bg-card p-4 sm:p-6 rounded-lg border h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Gráfico de Lucro Acumulado</h3>
        </div>
        <div className="flex items-center justify-center h-full text-muted-foreground flex-1">
          <p className="text-sm sm:text-base">
            Nenhum trade fechado para exibir o gráfico
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg border h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Gráfico de Lucro Acumulado</h3>
      </div>
      <div className="h-full flex-1">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CumulativeProfitChart;
