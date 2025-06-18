import React from 'react';
import { Line } from 'react-chartjs-2';
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
} from 'chart.js';
import { Trade } from '../types/trade';

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
    trades: Trade[];
}

const CumulativeProfitChart: React.FC<CumulativeProfitChartProps> = ({ trades }) => {
    const sortedTrades = [...trades]
        .filter(t => t.exit_date && t.result != null)
        .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime());
    
    let cumulativeProfit = 0;
    const chartData: ChartData<'line'> = {
        labels: ['Início'],
        datasets: [
            {
                label: 'Lucro Acumulado',
                data: [0],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 6,
            },
        ],
    };

    sortedTrades.forEach((trade, index) => {
        if (trade.result != null) {
            cumulativeProfit += Number(trade.result);
            chartData.labels!.push(`Trade ${index + 1}`);
            (chartData.datasets[0].data as number[]).push(cumulativeProfit);
        }
    });

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
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
                    label: function(context) {
                        return `Lucro Acumulado: R$ ${context.parsed.y.toFixed(2)}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'R$ ' + (typeof value === 'number' ? value.toFixed(2) : value);
                    },
                    font: {
                        size: window.innerWidth < 640 ? 10 : 12,
                    },
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
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
                    color: 'rgba(0, 0, 0, 0.1)',
                },
            },
        },
    };

    if (sortedTrades.length === 0) {
        return (
            <div className="bg-white p-4 sm:p-6 rounded-lg border">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Gráfico de Lucro Acumulado</h2>
                <div className="flex items-center justify-center h-40 sm:h-64 text-gray-500">
                    <p className="text-sm sm:text-base">Nenhum trade fechado para exibir o gráfico</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg border">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Gráfico de Lucro Acumulado</h2>
            <div className="h-40 sm:h-64 md:h-80">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default CumulativeProfitChart; 