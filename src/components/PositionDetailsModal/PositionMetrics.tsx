import React from "react";
import { Position } from "../../types/trade";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PositionMetricsProps {
  position: Position;
  closedPositionMetrics: {
    total_quantity: number;
    average_exit_price: number;
  };
}

const PositionMetrics: React.FC<PositionMetricsProps> = ({
  position,
  closedPositionMetrics,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
          Tipo
        </label>
        <div className="mt-1">
          <span
            className={cn(
              "px-2.5 py-0.5 text-sm font-semibold rounded-full",
              position.type === "Buy"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {position.type === "Buy" ? "Compra" : "Venda"}
          </span>
        </div>
      </div>
      <div>
        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
          Data de Entrada
        </label>
        <p className="mt-1 text-sm sm:text-base font-medium">
          {formatDate(position.initial_entry_date)}
        </p>
      </div>
      <div>
        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
          Preço Médio de Entrada
        </label>
        <p className="mt-1 text-sm sm:text-base font-medium">
          {formatCurrency(position.average_entry_price)}
        </p>
      </div>
      {position.status === "Closed" && (
        <div>
          <label className="text-xs sm:text-sm font-medium text-muted-foreground">
            Preço Médio de Saída
          </label>
          <p className="mt-1 text-sm sm:text-base font-medium">
            {closedPositionMetrics.average_exit_price > 0
              ? formatCurrency(closedPositionMetrics.average_exit_price)
              : "-"}
          </p>
        </div>
      )}
      {position.status === "Open" && (
        <div>
          <label className="text-xs sm:text-sm font-medium text-muted-foreground">
            Capital Alocado
          </label>
          <p className="mt-1 text-sm sm:text-base font-medium">
            {formatCurrency(
              Number(position.current_quantity) * Number(position.average_entry_price)
            )}
          </p>
        </div>
      )}
      <div>
        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
          {position.status === "Closed"
            ? "Quantidade Total"
            : "Quantidade Atual"}
        </label>
        <p className="mt-1 text-sm sm:text-base font-medium">
          {position.status === "Closed"
            ? closedPositionMetrics.total_quantity
            : Number(position.current_quantity)}
        </p>
      </div>
      <div>
        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
          Data de Saída
        </label>
        <p className="mt-1 text-sm sm:text-base font-medium">
          {formatDate(position.last_exit_date)}
        </p>
      </div>
    </div>
  );
};

export default PositionMetrics; 