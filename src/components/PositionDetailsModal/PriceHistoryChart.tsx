"use client";

import React, { useState, useEffect } from "react";
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
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { getPriceHistory } from "@/services/tradeService";
import { PriceCandle } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import Loader from "../ui/Loader";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface PriceHistoryChartProps {
  ticker: string;
  entryDate: Date;
  exitDate?: Date | null;
  status: "Open" | "Closed";
  averageEntryPrice: number;
  stopGain?: number;
  stopLoss?: number;
  positionType: "Buy" | "Sell";
}

function getRangeAndInterval(entryDate: Date, exitDate?: Date | null, status?: string): { range: string; interval: string } {
  const endDate = status === "Closed" && exitDate ? new Date(exitDate) : new Date();
  const diffDays = (endDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays <= 5) return { range: "5d", interval: "1d" };
  if (diffDays <= 30) return { range: "1mo", interval: "1d" };
  if (diffDays <= 90) return { range: "3mo", interval: "1d" };
  if (diffDays <= 180) return { range: "6mo", interval: "1d" };
  if (diffDays <= 365) return { range: "1y", interval: "1wk" };
  if (diffDays <= 730) return { range: "2y", interval: "1wk" };
  return { range: "5y", interval: "1mo" };
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  ticker,
  entryDate,
  exitDate,
  status,
  averageEntryPrice,
  stopGain,
  stopLoss,
}) => {
  const { theme } = useTheme();
  const [candles, setCandles] = useState<PriceCandle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(12);

  useEffect(() => {
    setFontSize(window.innerWidth < 640 ? 10 : 12);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { range, interval } = getRangeAndInterval(entryDate, exitDate, status);
      const data = await getPriceHistory(ticker, range, interval);
      setCandles(data.candles);
      setIsLoading(false);
    };

    fetchData();
  }, [ticker, entryDate, exitDate, status]);

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg border border-border/30">
        <Loader />
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg border border-border/30">
        <p className="text-sm text-muted-foreground">
          Dados de preço indisponíveis para este ativo
        </p>
      </div>
    );
  }

  const formatLabel = (timestamp: number): string => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const chartData: ChartData<"line"> = {
    labels: candles.map((c) => formatLabel(c.timestamp)),
    datasets: [
      {
        label: `${ticker}`,
        data: candles.map((c) => c.close),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        fill: true,
        tension: 0.2,
        pointRadius: candles.length > 60 ? 0 : 2,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const annotations: Record<string, object> = {};

  annotations.entryPrice = {
    type: "line" as const,
    yMin: averageEntryPrice,
    yMax: averageEntryPrice,
    borderColor: theme === "dark" ? "#60a5fa" : "#2563eb",
    borderWidth: 2,
    borderDash: [6, 4],
    label: {
      display: true,
      content: `Entrada: ${formatCurrency(averageEntryPrice)}`,
      position: "start" as const,
      backgroundColor: theme === "dark" ? "#1e3a5f" : "#dbeafe",
      color: theme === "dark" ? "#93c5fd" : "#1d4ed8",
      font: { size: 10 },
    },
  };

  if (stopGain) {
    annotations.stopGain = {
      type: "line" as const,
      yMin: stopGain,
      yMax: stopGain,
      borderColor: theme === "dark" ? "#4ade80" : "#16a34a",
      borderWidth: 1.5,
      borderDash: [4, 4],
      label: {
        display: true,
        content: `SG: ${formatCurrency(stopGain)}`,
        position: "end" as const,
        backgroundColor: theme === "dark" ? "#14532d" : "#dcfce7",
        color: theme === "dark" ? "#86efac" : "#166534",
        font: { size: 10 },
      },
    };
  }

  if (stopLoss) {
    annotations.stopLoss = {
      type: "line" as const,
      yMin: stopLoss,
      yMax: stopLoss,
      borderColor: theme === "dark" ? "#f87171" : "#dc2626",
      borderWidth: 1.5,
      borderDash: [4, 4],
      label: {
        display: true,
        content: `SL: ${formatCurrency(stopLoss)}`,
        position: "end" as const,
        backgroundColor: theme === "dark" ? "#450a0a" : "#fef2f2",
        color: theme === "dark" ? "#fca5a5" : "#991b1b",
        font: { size: 10 },
      },
    };
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Fechamento: ${formatCurrency(context.parsed.y)}`;
          },
          afterLabel: (context) => {
            const candle = candles[context.dataIndex];
            if (!candle) return "";
            return [
              `Abertura: ${formatCurrency(candle.open)}`,
              `Máxima: ${formatCurrency(candle.high)}`,
              `Mínima: ${formatCurrency(candle.low)}`,
            ];
          },
        },
      },
      annotation: {
        annotations,
      },
    },
    scales: {
      y: {
        ticks: {
          color: theme === "dark" ? "#cbd5e1" : "#475569",
          callback: (value) =>
            "R$ " + (typeof value === "number" ? value.toFixed(2) : value),
          font: { size: fontSize },
          maxTicksLimit: 6,
        },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.08)",
        },
      },
      x: {
        ticks: {
          color: theme === "dark" ? "#cbd5e1" : "#475569",
          font: { size: fontSize },
          maxTicksLimit: 6,
          maxRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-[300px] bg-muted/20 rounded-lg border border-border/30 p-3">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PriceHistoryChart;
