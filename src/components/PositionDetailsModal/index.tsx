import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  PlusCircle,
  CircleMinus,
  Info,
} from "lucide-react";
import Modal from "../ui/Modal";
import PositionForm, { PositionFormData } from "../PositionForm";
import { Button } from "../ui/Button";
import { Position, Operation } from "../../types/trade";
import { cn, formatCurrency } from "@/lib/utils";
import {
  getOperationsByPositionId,
  updatePosition,
  deletePosition,
  incrementPosition,
  executePartialExit,
  deleteOperation,
} from "@/services/tradeService";
import PositionIncrementForm from "./PositionIncrementForm";
import PartialExitForm from "./PartialExitForm";
import ConfirmationModal from "../ui/ConfirmationModal";
import OperationsHistory from "./OperationsHistory";
import PositionMetrics from "./PositionMetrics";
import { Input } from "../ui/Input";
import PnlChip from "../ui/PnlChip";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useDebounce } from "@/hooks/useDebounce";
import { getUnrealizedPnl } from "@/lib/pnl";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<Operation | null>(
    null
  );

  const { getPrice, setPrice, syncFromBackend, persistToBackend } = useLivePrices();
  const [inputPrice, setInputPrice] = useState<string>("");
  const [tempPrice, setTempPrice] = useState<string>(""); // Valor temporário durante edição
  const [originalPrice, setOriginalPrice] = useState<number>(0); // Preço original antes da edição
  const debouncedPrice = useDebounce(inputPrice, 400);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const refreshPositionDetails = () => {
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
  };

  useEffect(() => {
    if (position) {
      refreshPositionDetails();
    }
  }, [position]);

  // Hidratar preço atual do backend/localStorage ao abrir
  useEffect(() => {
    if (!position) return;
    const existing = getPrice(position.id) ?? position.current_price;
    if (existing && Number.isFinite(existing)) {
      setInputPrice(String(existing));
      setPrice(position.id, Number(existing));
    }
    // tenta sincronizar do backend
    syncFromBackend(position.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.id]);

  useEffect(() => {
    if (!position || !debouncedPrice || isEditingPrice) return;
    const numeric = parseFloat(debouncedPrice);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    setPrice(position.id, numeric);
  }, [debouncedPrice, position, setPrice, isEditingPrice]);

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
    setIsDeleting(true);
    try {
      await deletePosition(position.id);
      setIsDeleteConfirmOpen(false);
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Erro ao deletar posição:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleIncrementSubmit = async (data: {
    quantity: number;
    price: number;
    date: string;
  }) => {
    await incrementPosition(position.id, data);
    onUpdate();
    refreshPositionDetails();
    setIsIncrementModalOpen(false);
  };

  const handlePartialExitSubmit = async (data: {
    quantity: number;
    price: number;
    date: string;
  }) => {
    await executePartialExit(position.id, data);
    onUpdate();
    refreshPositionDetails();
    setIsPartialExitModalOpen(false);
  };

  const openDeleteOperationConfirm = (operation: Operation) => {
    setOperationToDelete(operation);
  };

  const handleDeleteOperation = async () => {
    if (!operationToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOperation(
        position.id.toString(),
        operationToDelete.id.toString()
      );
      setOperationToDelete(null);
      onUpdate();
      refreshPositionDetails();
    } catch (error) {
      console.error("Erro ao deletar operação:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePrice = async () => {
    const numericPrice = parseFloat(tempPrice);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return;

    try {
      setPrice(position.id, numericPrice);
      await persistToBackend(position.id, numericPrice);
      setInputPrice(tempPrice);
      setIsEditingPrice(false);
    } catch (error) {
      console.error("Erro ao salvar preço:", error);
    }
  };

  const handleCancelPriceEdit = () => {
    setTempPrice(inputPrice);
    setIsEditingPrice(false);
  };

  const handleStartPriceEdit = () => {
    setOriginalPrice(parseFloat(inputPrice) || 0);
    setTempPrice(inputPrice);
    setIsEditingPrice(true);
  };

  const isEditRestricted =
    position.status === "Closed" || operations.length > 1;

  // Lógica para calcular os valores derivados para posições fechadas
  const closedPositionMetrics = React.useMemo(() => {
    if (position.status !== "Closed" || operations.length === 0) {
      return { total_quantity: 0, average_exit_price: 0 };
    }

    const entryOperations = operations.filter(
      (op) => op.operation_type === "Entry" || op.operation_type === "Increment"
    );
    const exitOperations = operations.filter(
      (op) => op.operation_type === "PartialExit"
    );

    const total_quantity = entryOperations.reduce(
      (acc, op) => acc + Number(op.quantity),
      0
    );

    let average_exit_price = 0;
    if (exitOperations.length > 0) {
      const totalExitValue = exitOperations.reduce(
        (acc, op) => acc + Number(op.price) * Number(op.quantity),
        0
      );
      const totalExitQuantity = exitOperations.reduce(
        (acc, op) => acc + Number(op.quantity),
        0
      );
      average_exit_price =
        totalExitQuantity > 0 ? totalExitValue / totalExitQuantity : 0;
    }

    return { total_quantity, average_exit_price };
  }, [position, operations]);

  if (isEditing) {
    // Criamos uma cópia dos dados iniciais para passar ao formulário
    const formData = {
      ...position,
      // Se a posição estiver fechada, usamos a quantidade total calculada
      quantity:
        position.status === "Closed"
          ? closedPositionMetrics.total_quantity
          : Number(position.current_quantity),
      // Convertemos o preço médio para número
      price: Number(position.average_entry_price),
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
            <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <span>{position.ticker}</span>
            </h3>
            <div className="flex items-center gap-2">

              <div className="relative group">
                <Info
                  size={18}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-help flex-shrink-0"
                />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-md text-center">
                  <div className="break-words">
                    Resultado parcial - enquanto a posição não for realizada, não terá lucro/prejuízo efetivo
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-popover"></div>
                </div>
              </div>
              {position.status === "Open" && (
                (() => {
                  const current = inputPrice && Number.isFinite(parseFloat(inputPrice)) ? parseFloat(inputPrice) : (position.current_price || 0);
                  const entry = Number(position.average_entry_price) || 0;
                  const diffPct = entry > 0 && current > 0 ? ((current - entry) / entry) * 100 : 0;
                  const unrealized = getUnrealizedPnl(position, current) || 0;
                  return (
                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn("ml-1", diffPct >= 0 ? "text-green-600" : "text-red-600")}>
                        {`${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(2)}%`}
                      </span>
                      <PnlChip value={unrealized} title="PnL não realizado" className="ml-1" size="sm" type="unrealized" />

                    </div>
                  );
                })()
              )}
            </div>

            {position.status === "Closed" && (
              <PnlChip value={position.total_realized_pnl} size="md" type="realized" />
            )}
          </div>
          {position.status === "Open" && (
            (() => {
              const current = inputPrice && Number.isFinite(parseFloat(inputPrice)) ? parseFloat(inputPrice) : (position.current_price || 0);
              return (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs sm:text-sm text-muted-foreground">Último preço:</span>
                  {isEditingPrice ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="h-8 w-28"
                        autoFocus
                        aria-label="Editar último preço"
                      />
                      <button
                        type="button"
                        onClick={handleSavePrice}
                        className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                        title="Salvar preço"
                        aria-label="Salvar preço"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPriceEdit}
                        className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                        title="Cancelar edição"
                        aria-label="Cancelar edição"
                      >
                        <CircleMinus size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {current > 0 ? `${Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current)}` : '-'}
                      </span>
                      <button
                        type="button"
                        onClick={handleStartPriceEdit}
                        className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-muted/60 transition-colors"
                        title="Editar último preço"
                        aria-label="Editar último preço"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}
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
            <OperationsHistory
              operations={operations}
              isLoading={isLoading}
              position={position}
              onDeleteOperation={openDeleteOperationConfirm}
            />
          )}

          <PositionMetrics
            position={position}
            closedPositionMetrics={closedPositionMetrics}
            currentPrice={(inputPrice && Number.isFinite(parseFloat(inputPrice)) ? parseFloat(inputPrice) : undefined)}
          />


          {(position.setup || position.observations || position.stop_gain || position.stop_loss) && (
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
              {(position.stop_gain || position.stop_loss) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Stop Gain/Loss
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {position.stop_gain && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                          Stop Gain
                        </label>
                        <p className="mt-1 text-sm sm:text-base font-medium text-green-600">
                          {formatCurrency(position.stop_gain)}
                        </p>
                      </div>
                    )}
                    {position.stop_loss && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                          Stop Loss
                        </label>
                        <p className="mt-1 text-sm sm:text-base font-medium text-red-600">
                          {formatCurrency(position.stop_loss)}
                        </p>
                      </div>
                    )}
                    {position.stop_gain && position.stop_loss && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                          Payoff (R:R)
                        </label>
                        <p className="mt-1 text-sm sm:text-base font-medium">
                          {(() => {
                            const entryPrice = position.average_entry_price;
                            const stopGain = position.stop_gain;
                            const stopLoss = position.stop_loss;

                            if (!entryPrice || !stopGain || !stopLoss) return "-";

                            const potentialGain = Math.abs(stopGain - entryPrice);
                            const potentialLoss = Math.abs(entryPrice - stopLoss);

                            if (potentialLoss === 0) return "-";

                            const payoffRatio = potentialGain / potentialLoss;
                            return `${payoffRatio.toFixed(2)} : 1`;
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
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
                <CircleMinus className="mr-2 h-4 w-4" /> Registrar Saída
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
              title="Editar Posição"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="w-full sm:w-auto"
              title="Excluir Posição"
            >
              <Trash2 size={16} />
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
            currentQuantity={Number(position.current_quantity)}
          />
        </Modal>
      )}

      {isPartialExitModalOpen && (
        <Modal
          isOpen={isPartialExitModalOpen}
          onClose={() => setIsPartialExitModalOpen(false)}
          title="Registrar Saída"
        >
          <PartialExitForm
            onSubmit={handlePartialExitSubmit}
            onCancel={() => setIsPartialExitModalOpen(false)}
            remainingQuantity={Number(position.current_quantity)}
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
          loading={isDeleting}
        />
      )}

      {operationToDelete && (
        <ConfirmationModal
          isOpen={!!operationToDelete}
          onClose={() => setOperationToDelete(null)}
          onConfirm={handleDeleteOperation}
          title="Confirmar Exclusão de Operação"
          message={`Tem certeza que deseja excluir esta operação (${operationToDelete.operation_type === "Increment"
            ? "Incremento"
            : "Venda Parcial"
            } de ${operationToDelete.quantity} @ ${formatCurrency(
              Number(operationToDelete.price)
            )})? Esta ação irá recalcular toda a posição.`}
          loading={isDeleting}
        />
      )}
    </>
  );
};

export default PositionDetailsModal;
