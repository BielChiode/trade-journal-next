import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Info,
  GitCommitHorizontal,
} from "lucide-react";
import Modal from "./ui/Modal";
import TradeForm from "./TradeForm";
import { Button } from "./ui/Button";
import ConfirmationModal from "./ui/ConfirmationModal";
import { Trade } from "../types/trade";
import { getTradesByPositionId } from "../services/api";
import { cn } from "../lib/utils";

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  onUpdateTrade: (id: number, trade: Trade) => Promise<void>;
  onDeleteTrade: (id: number) => Promise<void>;
  onOpenPartialExit: (trade: Trade) => void;
  startInEditMode?: boolean;
}

const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  isOpen,
  onClose,
  trade,
  onUpdateTrade,
  onDeleteTrade,
  onOpenPartialExit,
  startInEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [positionTrades, setPositionTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIsEditing(startInEditMode);
      if (trade?.position_id) {
        getTradesByPositionId(trade.position_id)
          .then((response) => {
            setPositionTrades(response.data);
          })
          .catch(console.error);
      }
    } else {
      setTimeout(() => {
        setIsEditing(false);
        setIsConfirmModalOpen(false);
      }, 200);
    }
  }, [isOpen, startInEditMode, trade]);

  if (!trade) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (startInEditMode) {
      onClose();
    } else {
      setIsEditing(false);
    }
  };

  const handleUpdateTrade = async (tradeData: Trade) => {
    try {
      await onUpdateTrade(trade.id!, tradeData);
      setIsEditing(false);
      if (startInEditMode) {
        onClose();
      }
    } catch (error) {
      console.error("Erro ao atualizar trade:", error);
      throw error;
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteTrade(trade.id!);
      setIsConfirmModalOpen(false);
      onClose(); // Fecha o modal de detalhes também
    } catch (error) {
      console.error("Erro ao excluir trade:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const initialQuantity = positionTrades.reduce(
    (acc, t) => acc + (t.quantity || 0),
    0
  );
  const openTrade = positionTrades.find((t) => t.exit_price == null);
  console.log("openTrade", openTrade);
  const openQuantity = openTrade ? openTrade.quantity : 0;

  console.log("openQuantity", openQuantity);

  const totalRealizedProfit = positionTrades
    .filter((t) => t.exit_price != 0)
    .reduce((acc, t) => acc + (t.result || 0), 0);

  const isProfit = totalRealizedProfit >= 0;

  const closedTrades = positionTrades.filter(
    (t) => t.exit_price != null && t.exit_price > 0
  );
  let averageExitPrice = 0;
  let lastExitDate: string | null = null;

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

    const latestTrade = closedTrades.sort(
      (a, b) =>
        new Date(b.exit_date!).getTime() - new Date(a.exit_date!).getTime()
    )[0];
    lastExitDate = latestTrade.exit_date || null;
  }

  if (isEditing) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Editar Trade">
        <TradeForm
          onUpdateTrade={handleUpdateTrade}
          onCancel={handleCancelEdit}
          initialData={trade}
          isEditing={true}
        />
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Trade">
        <div className="space-y-4 sm:space-y-6">
          {/* Header com ticker e resultado */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-xl sm:text-2xl font-bold">{trade.ticker}</h3>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full self-start sm:self-auto ${
                isProfit
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="font-semibold">
                R$ {totalRealizedProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Histórico da Posição */}
          {positionTrades.length > 1 && (
            <div className="space-y-3 rounded-md border p-3">
              <h4 className="font-semibold text-base">Histórico da Posição</h4>
              {/* Trade em aberto */}
              {positionTrades
                .filter((t) => !t.exit_price)
                .map((t) => (
                  <div
                    key={`open-${t.id}`}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-600">
                      <GitCommitHorizontal size={14} /> Posição Aberta
                    </span>
                    <span className="font-medium">{t.quantity} ações</span>
                  </div>
                ))}
              {/* Trades fechados */}
              {positionTrades
                .filter((t) => t.exit_price != null && t.exit_price > 0)
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center text-sm py-1"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        Saída em{" "}
                        {new Date(t.exit_date!).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {t.quantity} - R$ {t.exit_price!.toFixed(2)}
                      </p>
                    </div>
                    <p
                      className={`font-semibold ${
                        t.result! >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.result! >= 0 ? "+" : ""}R$ {t.result!.toFixed(2)}
                    </p>
                  </div>
                ))}
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t">
                <span>Total Realizado</span>
                <span
                  className={`${
                    totalRealizedProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalRealizedProfit >= 0 ? "+" : ""}R${" "}
                  {totalRealizedProfit.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Informações básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">
                Tipo
              </label>
              <div className="mt-1">
                <span
                  className={cn(
                    "px-2.5 py-0.5 text-sm font-semibold rounded-full",
                    trade.type === "Buy"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  {trade.type === "Buy" ? "Compra" : "Venda"}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">
                Data de Entrada
              </label>
              <p className="mt-1 text-sm sm:text-base font-medium">
                {new Date(trade.entry_date).toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                })}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">
                Preço de Entrada
              </label>
              <p className="mt-1 text-sm sm:text-base font-medium">
                R$ {trade.entry_price.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">
                {openQuantity > 0 ? "Preço Médio de Saída" : "Preço de Saída"}
              </label>
              <p className="mt-1 text-sm sm:text-base font-medium">
                {closedTrades.length > 0
                  ? `R$ ${averageExitPrice.toFixed(2)}`
                  : "-"}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">
                Quantidade
              </label>
              <p className="mt-1 text-sm sm:text-base font-medium">
                {initialQuantity}
              </p>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-600">
                Data de Saída
              </label>
              <p className="mt-1 text-sm sm:text-base font-medium">
                {lastExitDate
                  ? new Date(lastExitDate).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })
                  : "-"}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {(trade.setup || trade.observations) && (
            <div className="space-y-3">
              {trade.setup && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">
                    Setup
                  </label>
                  <p className="mt-1 text-sm sm:text-base">{trade.setup}</p>
                </div>
              )}
              {trade.observations && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">
                    Observações
                  </label>
                  <p className="mt-1 text-sm sm:text-base whitespace-pre-wrap">
                    {trade.observations}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4 border-t">
          {openQuantity > 0 && (
            <Button
              variant="outline"
              onClick={() => onOpenPartialExit(openTrade!)}
            >
              <GitCommitHorizontal size={16} className="mr-2" />
              Registrar Saída Parcial
            </Button>
          )}

          <Button variant="outline" onClick={handleEdit}>
            <Edit size={16} className="mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 size={16} className="mr-2" />
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Você tem certeza que deseja excluir este trade? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={isDeleting}
      />
    </>
  );
};

export default TradeDetailsModal;
