import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  PlusCircle,
} from "lucide-react";
import Modal from "./ui/Modal";
import PositionForm, { PositionFormData } from "./PositionForm";
import { Button } from "./ui/Button";
import { Position, Operation } from "../types/trade";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  getOperationsByPositionId,
  updatePosition,
  deletePosition,
  incrementPosition,
  executePartialExit,
} from "@/services/tradeService";
import Loader from "./ui/Loader";
import PositionIncrementForm from "./PositionIncrementForm";
import PartialExitForm from "./PartialExitForm";
import ConfirmationModal from "./ui/ConfirmationModal";

interface PositionDetailsModalProps {
  position: Position;
  onClose: () => void;
  onUpdate: () => void;
}

const PositionDetailsModal: React.FC<PositionDetailsModalProps> = ({
  position,
  onClose,
  onUpdate,
}) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);
  const [isPartialExitModalOpen, setIsPartialExitModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (position) {
      setIsLoading(true);
      getOperationsByPositionId(position.id)
        .then((operationsData) => {
          setOperations(operationsData || []);
        })
        .catch((error) => {
          console.error("Erro ao buscar operações:", error);
          setOperations([]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [position]);

  const handleUpdate = async (data: PositionFormData) => {
    try {
      await updatePosition(position.id, data);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar posição:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePosition(position.id);
      setIsDeleteConfirmOpen(false);
      onClose(); // Fecha o modal de detalhes
      onUpdate(); // Atualiza a lista no dashboard
    } catch (error) {
      console.error("Erro ao deletar posição:", error);
    }
  };

  const handleIncrementSubmit = async (data: {
    quantity: number;
    price: number;
    date: string;
  }) => {
    await incrementPosition(position.id, data);
    onUpdate();
    setIsIncrementModalOpen(false);
  };

  const handlePartialExitSubmit = async (data: {
    quantity: number;
    price: number;
    date: string;
  }) => {
    await executePartialExit(position.id, data);
    onUpdate();
    setIsPartialExitModalOpen(false);
  };

  const isProfit = position.total_realized_pnl >= 0;
  const isEditRestricted = position.status === 'Closed' || operations.length > 1;

  // Lógica para calcular os valores derivados para posições fechadas
  const closedPositionMetrics = React.useMemo(() => {
    if (position.status !== 'Closed' || operations.length === 0) {
      return { total_quantity: 0, average_exit_price: 0 };
    }

    const entryOperations = operations.filter(op => op.operation_type === 'Entry' || op.operation_type === 'Increment');
    const exitOperations = operations.filter(op => op.operation_type === 'PartialExit');

    const total_quantity = entryOperations.reduce((acc, op) => acc + op.quantity, 0);
    
    let average_exit_price = 0;
    if (exitOperations.length > 0) {
      const totalExitValue = exitOperations.reduce((acc, op) => acc + (op.price * op.quantity), 0);
      const totalExitQuantity = exitOperations.reduce((acc, op) => acc + op.quantity, 0);
      average_exit_price = totalExitQuantity > 0 ? totalExitValue / totalExitQuantity : 0;
    }
    
    return { total_quantity, average_exit_price };
  }, [position, operations]);

  if (isEditing) {
    // Criamos uma cópia dos dados iniciais para passar ao formulário
    const formData = {
      ...position,
      // Se a posição estiver fechada, usamos a quantidade total calculada
      quantity: position.status === 'Closed' ? closedPositionMetrics.total_quantity : position.current_quantity,
      // Convertemos o preço médio para número
      price: position.average_entry_price,
      // Formatamos a data
      date: position.initial_entry_date.toISOString().split("T")[0],
    };

    return (
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Posição"
      >
        <PositionForm
          onSubmit={handleUpdate}
          onClose={() => setIsEditing(false)}
          initialData={formData}
          isEditing={true}
          isEditRestricted={isEditRestricted}
        />
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Detalhes da Posição">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-xl sm:text-2xl font-bold">{position.ticker}</h3>
            {position.status === "Closed" && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full self-start sm:self-auto ${
                  isProfit
                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                }`}
              >
                {isProfit ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                <span className="font-semibold">
                  {formatCurrency(position.total_realized_pnl)}
                </span>
              </div>
            )}
          </div>
          <div className="pb-3 pt-2 border-t">
            <div
              className={cn(
                "flex items-center gap-2 text-sm",
                position.status === "Open"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-400"
              )}
            >
              {position.status === "Open" ? (
                <Clock size={12} />
              ) : (
                <CheckCircle size={12} />
              )}
              <span>
                Posição {position.status === "Open" ? "Aberta" : "Fechada"}
              </span>
            </div>
          </div>

          {operations.length > 1 && (
            <div className="space-y-3 rounded-md border p-3">
              <h4 className="font-semibold text-base">Histórico da Posição</h4>
              {isLoading ? (
                <Loader />
              ) : (
                operations.map((op) => {
                  if (op.operation_type === "Entry") return null;
                  const isIncrement = op.operation_type === "Increment";
                  const profit = op.result && op.result > 0;

                  return (
                    <div
                      key={op.id}
                      className="flex justify-between items-center text-sm py-1"
                    >
                      <div className="flex items-center gap-2">
                        {isIncrement ? (
                          <ArrowUp size={18} className="text-green-500" />
                        ) : (
                          <ArrowDown
                            size={18}
                            className={
                              profit ? "text-green-500" : "text-red-500"
                            }
                          />
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {isIncrement ? "Incremento" : "Venda Parcial"}:{" "}
                            {op.quantity} @ {formatCurrency(op.price)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Em {formatDate(op.date)}
                          </p>
                        </div>
                      </div>
                      {!isIncrement && op.result != null && (
                        <span
                          className={`font-semibold ${
                            profit ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {profit ? "+" : ""}
                          {formatCurrency(op.result)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

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
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                {position.status === "Closed"
                  ? "Quantidade Total"
                  : "Quantidade Atual"}
              </label>
              <p className="mt-1 text-sm sm:text-base font-medium">
                {position.status === "Closed"
                  ? closedPositionMetrics.total_quantity
                  : position.current_quantity}
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

          {(position.setup || position.observations) && (
            <div className="space-y-3 pt-4 mt-4 border-t">
              {position.setup && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Setup
                  </label>
                  <p className="mt-1 text-sm sm:text-base">{position.setup}</p>
                </div>
              )}
              {position.observations && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Observações
                  </label>
                  <p className="mt-1 text-sm sm:text-base whitespace-pre-wrap">
                    {position.observations}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4 border-t">
          {position.status === "Open" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsPartialExitModalOpen(true)}
                className="w-full"
              >
                <TrendingDown className="mr-2 h-4 w-4" /> Saída Parcial
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsIncrementModalOpen(true)}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Incrementar Posição
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              variant="default"
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto"
            >
              <Edit size={16} className="mr-2" /> Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 size={16} className="mr-2" /> Excluir Posição
            </Button>
          </div>
        </div>
      </Modal>

      {isIncrementModalOpen && (
        <Modal
          isOpen={isIncrementModalOpen}
          onClose={() => setIsIncrementModalOpen(false)}
          title="Incrementar Posição"
        >
          <PositionIncrementForm
            onSubmit={handleIncrementSubmit}
            onCancel={() => setIsIncrementModalOpen(false)}
            currentQuantity={position.current_quantity}
          />
        </Modal>
      )}

      {isPartialExitModalOpen && (
        <Modal
          isOpen={isPartialExitModalOpen}
          onClose={() => setIsPartialExitModalOpen(false)}
          title="Saída Parcial"
        >
          <PartialExitForm
            onSubmit={handlePartialExitSubmit}
            onCancel={() => setIsPartialExitModalOpen(false)}
            remainingQuantity={position.current_quantity}
          />
        </Modal>
      )}

      {isDeleteConfirmOpen && (
        <ConfirmationModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Confirmar Exclusão"
          message="Tem certeza de que deseja excluir esta posição? Esta ação não pode ser desfeita."
        />
      )}
    </>
  );
};

export default PositionDetailsModal;
