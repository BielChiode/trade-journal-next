import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { cn } from "../lib/utils";
import { Button } from './ui/Button';
import { PlusCircle } from 'lucide-react';
import { Trade } from '../types/trade';

interface TradeCardProps {
    trade: Trade;
    onClick: (trade: Trade) => void;
    onAddExitPrice?: (trade: Trade) => void;
}

const TradeCard: React.FC<TradeCardProps> = ({ trade, onClick, onAddExitPrice }) => {
    const isProfit = (trade.resultado ?? 0) >= 0;

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    const formatCurrency = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return 'N/A';
        return `R$ ${Number(value).toFixed(2)}`;
    }

    const handleAddExitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if(onAddExitPrice) {
            onAddExitPrice(trade);
        }
    };

    return (
        <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 active:scale-[0.98] flex flex-col"
            onClick={() => onClick(trade)}
        >
            <div className="flex-grow">
                <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex justify-between items-start gap-2">
                        <span className="text-base sm:text-lg font-bold truncate">{trade.ticker}</span>
                        <span className={cn(
                            "text-sm sm:text-base font-bold shrink-0",
                            isProfit ? "text-green-500" : "text-red-500"
                        )}>
                            {isProfit ? '+' : ''}{formatCurrency(trade.resultado)}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 sm:space-y-2 pb-3 sm:pb-4">
                    <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between items-center">
                            <span>Entrada:</span>
                            <span className="font-medium">{formatDate(trade.data_entrada)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Preço:</span>
                            <span className="font-medium">{formatCurrency(trade.preco_entrada)}</span>
                        </div>
                        {(trade.data_saida || trade.preco_saida) && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span>Saída:</span>
                                    <span className="font-medium">{formatDate(trade.data_saida)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Preço:</span>
                                    <span className="font-medium">{formatCurrency(trade.preco_saida)}</span>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {trade.setup && (
                        <div className="pt-2 border-t">
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">Setup:</span> {trade.setup}
                            </p>
                        </div>
                    )}
                </CardContent>
            </div>
            
            <div className="px-4 pb-3 pt-2 border-t">
                {(!trade.preco_saida && onAddExitPrice) ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleAddExitClick}
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Adicionar Saída
                    </Button>
                ) : (
                    <div className="text-center text-xs text-gray-500">
                        Clique para ver detalhes
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TradeCard; 