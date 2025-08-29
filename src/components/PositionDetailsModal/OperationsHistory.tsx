import React from "react";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Position, Operation } from "../../types/trade";
import { formatCurrency, formatDate } from "@/lib/utils";
import Loader from "../ui/Loader";

interface OperationsHistoryProps {
  operations: Operation[];
  isLoading: boolean;
  position: Position;
  onDeleteOperation: (operation: Operation) => void;
}

const OperationsHistory: React.FC<OperationsHistoryProps> = ({
  operations,
  isLoading,
  position,
  onDeleteOperation,
}) => {
  if (operations.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <h4 className="font-semibold text-base">Histórico da Posição</h4>
      {isLoading ? (
        <Loader />
      ) : (
        operations.map((op) => {
          if (op.operation_type === "Entry") return null;
          const isIncrement = op.operation_type === "Increment";
          const profit = op.result && op.result > 0;

          let percentageResult = 0;
          if (
            !isIncrement &&
            op.result != null &&
            op.quantity > 0 &&
            position.average_entry_price > 0
          ) {
            const pnlPerShare = op.result / op.quantity;
            percentageResult = pnlPerShare / position.average_entry_price;
          }

          return (
            <div
              key={op.id}
              className="flex justify-between items-center text-sm py-1 group"
            >
              <div className="flex items-center gap-2">
                {isIncrement ? (
                  <ArrowUp size={18} className="text-green-500" />
                ) : (
                  <ArrowDown
                    size={18}
                    className={profit ? "text-green-500" : "text-red-500"}
                  />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {isIncrement ? "Incremento" : "Venda Parcial"}: {op.quantity} @{" "}
                    {formatCurrency(op.price)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Em {formatDate(op.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isIncrement && op.result != null && (
                  <div className="text-right">
                    <span
                      className={`font-semibold ${
                        profit ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {profit ? "+" : ""}
                      {formatCurrency(op.result ? Number(op.result) : null)}
                    </span>
                    <p
                      className={`text-xs font-medium ${
                        profit ? "text-green-500/90" : "text-red-500/90"
                      }`}
                    >
                      {profit ? "+" : ""}
                      {percentageResult.toLocaleString("pt-BR", {
                        style: "percent",
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
                {position.status === "Open" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir Operação"
                    className="h-8 w-8"
                    onClick={() => onDeleteOperation(op)}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default OperationsHistory; 