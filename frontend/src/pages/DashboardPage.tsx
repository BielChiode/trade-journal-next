import React, { useState, useEffect } from "react";
import { PlusCircle, Plus } from "lucide-react";
import {
  getTrades,
  addTrade,
  updateTrade,
  deleteTrade,
  executePartialExit,
} from "../services/api";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import CumulativeProfitChart from "../components/CumulativeProfitChart";
import TradeCard from "../components/TradeCard";
import TradeForm from "../components/TradeForm";
import TradeDetailsModal from "../components/TradeDetailsModal";
import { Trade } from "../types/trade";
import PartialExitForm from "../components/PartialExitForm";

// Adicionar uma nova interface para o resumo da posição
export interface PositionSummary extends Trade {
  initialQuantity: number;
  openQuantity: number;
  totalRealizedProfit: number;
  status: "Open" | "Closed";
  tradesInPosition: Trade[];
}

// Function to group and summarize positions
const summarizePositions = (trades: Trade[]): PositionSummary[] => {
  const positions = new Map<number, Trade[]>();

  // 1. Group trades by position_id
  trades.forEach((trade) => {
    const positionId = trade.position_id!;
    if (!positions.has(positionId)) {
      positions.set(positionId, []);
    }
    positions.get(positionId)!.push(trade);
  });

  const summaries: PositionSummary[] = [];

  // 2. Create summaries for each position
  positions.forEach((tradesInPosition, positionId) => {
    const initialTrade = tradesInPosition.sort(
      (a, b) =>
        new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    )[0];
    const openTrade = tradesInPosition.find((t) => !t.exit_date);

    const initialQuantity = tradesInPosition.reduce(
      (acc, t) => acc + t.quantity,
      0
    );
    const totalRealizedProfit = tradesInPosition
      .filter((t) => t.exit_date)
      .reduce((acc, t) => acc + (t.result || 0), 0);

    summaries.push({
      ...initialTrade,
      id: positionId, // Use positionId as the unique ID for the card
      initialQuantity,
      openQuantity: openTrade?.quantity || 0,
      totalRealizedProfit,
      status: openTrade ? "Open" : "Closed",
      tradesInPosition,
    });
  });

  // Sort to show open positions first, then the newest
  return summaries.sort((a, b) => {
    if (a.status === "Open" && b.status !== "Open") return -1;
    if (a.status !== "Open" && b.status === "Open") return 1;
    return (
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
  });
};

const DashboardPage: React.FC = () => {
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null);
  const [selectedTradeForDetails, setSelectedTradeForDetails] =
    useState<Trade | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [isPartialExitModalOpen, setIsPartialExitModalOpen] = useState(false);
  const [tradeForPartialExit, setTradeForPartialExit] = useState<Trade | null>(
    null
  );

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const response = await getTrades();
      const summarized = summarizePositions(response.data);
      setPositions(summarized);
    } catch (error) {
      console.error("Erro ao carregar trades:", error);
    }
  };

  const handleAddTrade = async (tradeData: Trade) => {
    try {
      let result = 0;
      if (
        tradeData.entry_price &&
        tradeData.exit_price &&
        tradeData.quantity
      ) {
        const entry = tradeData.entry_price;
        const exit = tradeData.exit_price;
        const quantity = tradeData.quantity;

        if (tradeData.type === "Buy") {
          result = (exit - entry) * quantity;
        } else {
          result = (entry - exit) * quantity;
        }
      }

      const tradeWithResult = {
        ...tradeData,
        result,
      };

      await addTrade(tradeWithResult);
      setIsTradeModalOpen(false);
      loadTrades();
    } catch (error) {
      console.error("Erro ao adicionar trade:", error);
      throw error;
    }
  };

  const handleUpdateTrade = async (tradeId: number, tradeData: Trade) => {
    try {
      let result = 0;
      if (
        tradeData.entry_price &&
        tradeData.exit_price &&
        tradeData.quantity
      ) {
        const entry = tradeData.entry_price;
        const exit = tradeData.exit_price;
        const quantity = tradeData.quantity;

        if (tradeData.type === "Buy") {
          result = (exit - entry) * quantity;
        } else {
          result = (entry - exit) * quantity;
        }
      }

      const tradeWithResult = {
        ...tradeData,
        result,
      };

      await updateTrade(tradeId, tradeWithResult);
      loadTrades();
    } catch (error) {
      console.error("Erro ao atualizar trade:", error);
      throw error;
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    try {
      await deleteTrade(tradeId);
      setIsDetailsModalOpen(false);
      loadTrades(); // Recarregar a lista de trades
    } catch (error) {
      console.error("Erro ao excluir trade:", error);
      throw error;
    }
  };

  const handleTradeClick = (position: PositionSummary) => {
    const representativeTrade = position.tradesInPosition.sort(
      (a, b) =>
        new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    )[0];
    setSelectedTradeForDetails(representativeTrade);
    setStartInEditMode(false);
    setIsDetailsModalOpen(true);
  };

  const handleAddExitPrice = (trade: Trade) => {
    setSelectedTradeForDetails(trade);
    setStartInEditMode(true);
    setIsDetailsModalOpen(true);
  };

  const handleOpenPartialExitModal = (trade: Trade) => {
    setTradeForPartialExit(trade);
    setIsDetailsModalOpen(false); // Fecha o modal de detalhes
    setIsPartialExitModalOpen(true);
  };

  const handlePartialExitSubmit = async (exitData: {
    exit_quantity: number;
    exit_price: number;
    exit_date: string;
  }) => {
    if (!tradeForPartialExit) return;
    try {
      await executePartialExit(tradeForPartialExit.id!, exitData);
      setIsPartialExitModalOpen(false);
      setTradeForPartialExit(null);
      loadTrades(); // Recarrega todos os trades
    } catch (error) {
      console.error("Erro ao executar saída parcial:", error);
      // Adicionar feedback para o usuário aqui, se desejar
    }
  };

  const closedTrades = positions.filter((p) => p.status === "Closed");

  const totalProfit = closedTrades.reduce(
    (acc, trade) => acc + (Number(trade.totalRealizedProfit) || 0),
    0
  );
  const totalTrades = closedTrades.length;
  const winRate =
    totalTrades > 0
      ? (closedTrades.filter((t) => (t.totalRealizedProfit ?? 0) > 0).length /
          totalTrades) *
        100
      : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header responsivo */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 border-b shrink-0 bg-background">
        <h1 className="text-base sm:text-lg font-semibold truncate">
          Trade Journal
        </h1>
        <Button
          onClick={() => setIsTradeModalOpen(true)}
          size="sm"
          className="sm:size-default"
        >
          <PlusCircle className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo Trade</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Cards de estatísticas responsivos */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Lucro Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-lg sm:text-2xl font-bold ${
                  totalProfit >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                R$ {totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Taxa de Acerto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                {winRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total de Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{totalTrades}</div>
            </CardContent>
          </Card>
        </div>

        {/* Layout principal responsivo */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 xl:grid-cols-2">
          {/* Gráfico */}
          <div className="order-2 xl:order-1">
            <CumulativeProfitChart trades={positions} />
          </div>

          {/* Histórico de trades */}
          <div className="order-1 xl:order-2">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Histórico de Trades
              </h2>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                title="Novo Trade"
                onClick={() => {
                  setCurrentTrade(null);
                  setIsTradeModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[520px] sm:max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {positions.length > 0 ? (
                  positions.map((position) => (
                    <TradeCard
                      key={position.id}
                      position={position}
                      onClick={() => handleTradeClick(position)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>Nenhum trade encontrado.</p>
                    <p className="text-sm mt-1">
                      Clique em "Novo Trade" para começar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal para adicionar novo trade */}
      <Modal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        title="Adicionar Novo Trade"
      >
        <TradeForm
          onAddTrade={handleAddTrade}
          onCancel={() => setIsTradeModalOpen(false)}
        />
      </Modal>

      {/* Modal para detalhes/edição do trade */}
      {selectedTradeForDetails && (
        <TradeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          trade={selectedTradeForDetails}
          onUpdateTrade={handleUpdateTrade}
          onDeleteTrade={handleDeleteTrade}
          onOpenPartialExit={handleOpenPartialExitModal}
          startInEditMode={startInEditMode}
        />
      )}

      {tradeForPartialExit && (
        <Modal
          isOpen={isPartialExitModalOpen}
          onClose={() => setIsPartialExitModalOpen(false)}
          title={`Saída Parcial de ${tradeForPartialExit.ticker}`}
        >
          <PartialExitForm
            onSubmit={handlePartialExitSubmit}
            onCancel={() => setIsPartialExitModalOpen(false)}
            remainingQuantity={tradeForPartialExit.quantity}
          />
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
