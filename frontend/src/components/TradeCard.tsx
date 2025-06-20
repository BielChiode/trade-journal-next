import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { cn } from "../lib/utils";
import {
  GitCommitHorizontal,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { PositionSummary } from "../pages/DashboardPage";

interface TradeCardProps {
  position: PositionSummary;
  onClick: (position: PositionSummary) => void;
}

const TradeCard: React.FC<TradeCardProps> = ({ position, onClick }) => {
  const isProfit = position.totalRealizedProfit >= 0;

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return `R$ ${Number(value).toFixed(2)}`;
  };

  const closedTrades = position.tradesInPosition.filter(
    (t) => t.exit_price != null && t.exit_price > 0
  );
  let averageExitPrice = 0;
  if (closedTrades.length > 0) {
    const totalExitValue = closedTrades.reduce(
      (acc, t) => acc + t.exit_price! * t.quantity,
      0
    );
    const totalExitedQuantity = closedTrades.reduce(
      (acc, t) => acc + t.quantity,
      0
    );
    if (totalExitedQuantity > 0) {
      averageExitPrice = totalExitValue / totalExitedQuantity;
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  };

  let displayDate = "";
  if (position.status === "Open") {
    displayDate = formatDate(position.entry_date);
  } else {
    const closedTradesWithDate = position.tradesInPosition.filter(
      (t) => t.exit_date
    );
    if (closedTradesWithDate.length > 0) {
      const lastExitDate = closedTradesWithDate.sort(
        (a, b) =>
          new Date(b.exit_date!).getTime() - new Date(a.exit_date!).getTime()
      )[0].exit_date;
      if (lastExitDate) {
        displayDate = formatDate(lastExitDate);
      }
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 active:scale-[0.98] flex flex-col"
      onClick={() => onClick(position)}
    >
      <div className="flex-grow">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex justify-between items-start gap-2 mb-4">
            <div className="flex items-center gap-2 truncate">
              <span className="text-base sm:text-lg font-bold truncate">
                {position.ticker}
              </span>
              {position.tradesInPosition.length > 1 && (
                <div title="Esta posição tem múltiplas saídas">
                  <GitCommitHorizontal
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
                </div>
              )}
            </div>
            {position.status === "Closed" && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold shrink-0",
                  isProfit
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {isProfit ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span>{formatCurrency(position.totalRealizedProfit)}</span>
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
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Qtd. Inicial:</span>
            <span className="font-medium">{position.initialQuantity}</span>
          </div>
          {position.status === "Open" && (
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground">Qtd. Aberta:</span>
              <span className="font-medium">{position.openQuantity}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Preço de Entrada:</span>
            <span className="font-medium">
              {formatCurrency(position.entry_price)}
            </span>
          </div>
          {position.status === "Closed" && (
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground">
                {closedTrades.length > 1
                  ? "Preço Médio Saída:"
                  : "Preço de Saída:"}
              </span>
              <span className="font-medium">
                {formatCurrency(averageExitPrice)}
              </span>
            </div>
          )}
        </CardContent>
      </div>

      <div className="px-4 pb-3 pt-2 border-t">
        <div
          className={cn(
            "flex items-center justify-between",
            position.status === "Open"
              ? "text-blue-600 text-sm"
              : "text-gray-500 text-xs"
          )}
        >
          <div className="flex items-center gap-2">
            {position.status === "Open" ? (
              <Clock size={12} />
            ) : (
              <CheckCircle size={12} />
            )}
            <span>
              Posição{" "}
              {position.status.toLowerCase() === "open" ? "Aberta" : "Fechada"}
            </span>
          </div>
          <span className="text-xs">{displayDate}</span>
        </div>
      </div>
    </Card>
  );
};

export default TradeCard;
