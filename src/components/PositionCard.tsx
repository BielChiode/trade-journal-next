import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Position } from "../types/trade";

interface PositionCardProps {
  position: Position;
  onClick: (position: Position) => void;
}

const PositionCard: React.FC<PositionCardProps> = ({ position, onClick }) => {
  const isProfit = position.total_realized_pnl >= 0;

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return `R$ ${Number(value).toFixed(2)}`;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  };

  const displayDate = formatDate(
    position.status === 'Open' ? position.initial_entry_date : position.last_exit_date
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 active:scale-[0.98] flex flex-col"
      onClick={() => onClick(position)}
    >
      <div className="flex-grow">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex justify-between items-start gap-2 mb-4">
              <span className="text-base sm:text-lg font-bold truncate">
                {position.ticker}
              </span>
            {position.status === "Closed" && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold shrink-0",
                  isProfit
                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                )}
              >
                {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatCurrency(position.total_realized_pnl)}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 sm:space-y-2 pb-3 sm:pb-4">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Tipo:</span>
            <span
              className={cn(
                "px-2 py-0.5 text-sm font-semibold rounded-full",
                position.type === "Buy"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              )}
            >
              {position.type === "Buy" ? "Compra" : "Venda"}
            </span>
          </div>
          {position.status === 'Closed' ? (
            <>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Qtd. Total:</span>
                <span className="font-medium">{position.total_quantity}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Preço Médio Entrada:</span>
                <span className="font-medium">
                  {formatCurrency(position.average_entry_price)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Preço Médio Saída:</span>
                <span className="font-medium">
                  {formatCurrency(position.average_exit_price)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Qtd. Atual:</span>
                <span className="font-medium">{position.current_quantity}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Preço Médio Entrada:</span>
                <span className="font-medium">
                  {formatCurrency(position.average_entry_price)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </div>

      <div className="px-4 pb-3 pt-2 border-t">
        <div
          className={cn(
            "flex items-center justify-between",
            position.status === "Open"
              ? "text-blue-600 text-sm"
              : "text-gray-400 text-xs"
          )}
        >
          <div className="flex items-center gap-2">
            {position.status === "Open" ? <Clock size={12} /> : <CheckCircle size={12} />}
            <span>
              Posição {position.status.toLowerCase() === "open" ? "Aberta" : "Fechada"}
            </span>
          </div>
          <span className="text-xs">{displayDate}</span>
        </div>
      </div>
    </Card>
  );
};

export default PositionCard;
