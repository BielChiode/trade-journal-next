import React from 'react';
import { Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import CumulativeProfitChart from '../../../components/CumulativeProfitChart';
import { formatCurrency } from '../../../lib/utils';
import { PositionSummary } from '../../../lib/tradeUtils';

interface DashboardMetricsProps {
    isEditingCapital: boolean;
    setIsEditingCapital: (isEditing: boolean) => void;
    tempCapital: string;
    setTempCapital: (value: string) => void;
    handleSaveCapital: () => void;
    initialCapital: number;
    positions: PositionSummary[];
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
    isEditingCapital,
    setIsEditingCapital,
    tempCapital,
    setTempCapital,
    handleSaveCapital,
    initialCapital,
    positions,
}) => {

    const closedTrades = positions.filter((p) => p.status === "Closed");

    const totalProfit = closedTrades.reduce(
        (acc, trade) => acc + (Number(trade.totalRealizedProfit) || 0),
        0
    );

    const totalTrades = closedTrades.length;
    const averageProfitPerTrade = totalTrades > 0 ? totalProfit / totalTrades : 0;
    const winRate =
        totalTrades > 0
            ? (closedTrades.filter((t) => (t.totalRealizedProfit ?? 0) > 0).length /
                totalTrades) *
            100
            : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Capital Inicial</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsEditingCapital(!isEditingCapital)}
                                className="h-8 w-8"
                            >
                                {isEditingCapital ? (
                                    <span className="text-xs">Cancelar</span>
                                ) : (
                                    <Edit size={14} />
                                )}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEditingCapital ? (
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    value={tempCapital}
                                    onChange={(e) => setTempCapital(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Button onClick={handleSaveCapital}>Salvar</Button>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold">
                                {formatCurrency(initialCapital)}
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Métricas Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                                Resultado Total:
                            </span>
                            <span
                                className={`font-bold text-lg ${totalProfit >= 0 ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {formatCurrency(totalProfit)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                                Lucro médio por trade:
                            </span>
                            <span
                                className={`font-medium ${averageProfitPerTrade >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}
                            >
                                {formatCurrency(averageProfitPerTrade)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                                Total de Trades:
                            </span>
                            <span className="font-medium">{totalTrades}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Taxa de Acerto:</span>
                            <span className="font-medium">{winRate.toFixed(1)}%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Gráfico de Lucro Cumulativo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CumulativeProfitChart positions={positions} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardMetrics; 