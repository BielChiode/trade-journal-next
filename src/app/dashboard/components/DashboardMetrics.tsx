"use client";

import React from 'react';
import { Position } from '@/types/trade';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import CumulativeProfitChart from '@/components/CumulativeProfitChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface DashboardMetricsProps {
    positions: Position[];
    initialCapital: number;
    setInitialCapital: (value: number) => void;
    isEditingCapital: boolean;
    setIsEditingCapital: (value: boolean) => void;
    tempCapital: number;
    setTempCapital: (value: number) => void;
    totalProfit: number;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
    positions,
    initialCapital,
    setInitialCapital,
    isEditingCapital,
    setIsEditingCapital,
    tempCapital,
    setTempCapital,
    totalProfit,
}) => {
    const closedPositions = positions.filter((p) => p.status === 'Closed');
    const totalTrades = closedPositions.length;
    const winningTrades = closedPositions.filter((p) => p.total_realized_pnl > 0).length;
    const losingTrades = closedPositions.filter((p) => p.total_realized_pnl < 0).length;

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) : 0;
    const averageProfit = winningTrades > 0 ? closedPositions.filter(p => p.total_realized_pnl > 0).reduce((acc, p) => acc + p.total_realized_pnl, 0) / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? closedPositions.filter(p => p.total_realized_pnl < 0).reduce((acc, p) => acc + p.total_realized_pnl, 0) / losingTrades : 0;

    const payoffRatio = averageLoss !== 0 ? Math.abs(averageProfit / averageLoss) : 0;

    const handleCapitalEdit = () => {
        if (isEditingCapital) {
            const newCapital = tempCapital;
            if (!isNaN(newCapital) && newCapital > 0) {
                setInitialCapital(newCapital);
                localStorage.setItem("initialCapital", newCapital.toString());
            }
        }
        setIsEditingCapital(!isEditingCapital);
    };

    const metricCards = [
        { title: 'Posições Encerradas', value: totalTrades },
        { title: 'Taxa de Acerto', value: formatPercentage(winRate) },
        { title: 'Lucro Médio', value: formatCurrency(averageProfit) },
        { title: 'Payoff Ratio', value: payoffRatio.toFixed(2) },
    ];
    
    const currentCapital = initialCapital + totalProfit;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            {/* Coluna de Métricas (3/12) */}
            <div className="lg:col-span-3 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Capital</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Capital Inicial</p>
                                <Button onClick={handleCapitalEdit} size="sm" variant="ghost">
                                    {isEditingCapital ? 'Salvar' : <PenSquare className="h-4 w-4" />}
                                </Button>
                            </div>
                            {isEditingCapital ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={tempCapital}
                                        onChange={(e) => setTempCapital(parseFloat(e.target.value))}
                                        className="h-9"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <p className="text-2xl font-bold">{formatCurrency(initialCapital)}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Capital Atual</p>
                            <p className="text-2xl font-bold">{formatCurrency(currentCapital)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Métricas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-center">
                        {metricCards.map(metric => (
                            <div key={metric.title}>
                                <p className="text-xl font-bold">{metric.value}</p>
                                <p className="text-sm text-muted-foreground">{metric.title}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Coluna do Gráfico (9/12) */}
            <div className="lg:col-span-9">
                <CumulativeProfitChart positions={positions} />
            </div>
        </div>
    );
};

export default DashboardMetrics; 