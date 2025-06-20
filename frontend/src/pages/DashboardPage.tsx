import React, { useState, useEffect } from "react";
import { PlusCircle, Plus, Edit, LogOut } from "lucide-react";
import {
  getTrades,
  addTrade,
  updateTrade,
  deleteTrade,
  executePartialExit,
} from "../services/tradeService";
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
import ConfirmationModal from "../components/ui/ConfirmationModal";
import { formatCurrency } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

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
    return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
  });
};

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null);
  const [selectedPosition, setSelectedPosition] =
    useState<PositionSummary | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [isPartialExitModalOpen, setIsPartialExitModalOpen] = useState(false);
  const [tradeForPartialExit, setTradeForPartialExit] = useState<Trade | null>(
    null
  );
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [tempCapital, setTempCapital] = useState<string>("0");

  useEffect(() => {
    loadTrades();
    const savedCapital = localStorage.getItem("initialCapital");
    if (savedCapital) {
      const capitalValue = parseFloat(savedCapital);
      if (!isNaN(capitalValue)) {
        setInitialCapital(capitalValue);
        setTempCapital(savedCapital);
      }
    }
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
      if (tradeData.entry_price && tradeData.exit_price && tradeData.quantity) {
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

      await new Promise((resolve) => setTimeout(resolve, 1500));
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
      if (tradeData.entry_price && tradeData.exit_price && tradeData.quantity) {
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

      await new Promise((resolve) => setTimeout(resolve, 1500));
      await updateTrade(tradeId, tradeWithResult);

      // Recarrega os trades e atualiza a posição selecionada
      const response = await getTrades();
      const newPositions = summarizePositions(response.data);
      setPositions(newPositions);

      if (selectedPosition) {
        const updatedSelectedPosition = newPositions.find(
          (p) => p.id === selectedPosition.id
        );
        setSelectedPosition(updatedSelectedPosition || null);
      }
    } catch (error) {
      console.error("Erro ao atualizar trade:", error);
      throw error;
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await deleteTrade(tradeId);
      setIsDetailsModalOpen(false);
      loadTrades(); // Recarregar a lista de trades
    } catch (error) {
      console.error("Erro ao excluir trade:", error);
      throw error;
    }
  };

  const handleTradeClick = (position: PositionSummary) => {
    setSelectedPosition(position);
    setStartInEditMode(false);
    setIsDetailsModalOpen(true);
  };

  const handleAddExitPrice = (trade: Trade) => {
    // Encontra a posição correspondente ao trade
    const position = positions.find((p) =>
      p.tradesInPosition.some((t) => t.id === trade.id)
    );
    if (position) {
      setSelectedPosition(position);
      setStartInEditMode(true);
      setIsDetailsModalOpen(true);
    }
  };

  const handleOpenPartialExitModal = (trade: Trade) => {
    setTradeForPartialExit(trade);
    setIsPartialExitModalOpen(true);
  };

  const handlePartialExitSubmit = async (exitData: {
    exit_quantity: number;
    exit_price: number;
    exit_date: string;
  }) => {
    if (!tradeForPartialExit) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await executePartialExit(tradeForPartialExit.id!, exitData);
      setIsPartialExitModalOpen(false);
      setTradeForPartialExit(null);

      // Recarrega os trades e atualiza a posição selecionada
      const response = await getTrades();
      const newPositions = summarizePositions(response.data);
      setPositions(newPositions);

      if (selectedPosition) {
        const updatedSelectedPosition = newPositions.find(
          (p) => p.id === selectedPosition.id
        );
        setSelectedPosition(updatedSelectedPosition || null);
      }
    } catch (error) {
      console.error("Erro ao executar saída parcial:", error);
      // Adicionar feedback para o usuário aqui, se desejar
    }
  };

  const handleSaveCapital = () => {
    const newCapital = parseFloat(tempCapital);
    if (!isNaN(newCapital)) {
      setInitialCapital(newCapital);
      localStorage.setItem("initialCapital", tempCapital);
      setIsEditingCapital(false);
    }
  };

  const closedTrades = positions.filter((p) => p.status === "Closed");

  const totalProfit = closedTrades.reduce(
    (acc, trade) => acc + (Number(trade.totalRealizedProfit) || 0),
    0
  );
  const currentCapital = initialCapital + totalProfit;
  const totalTrades = closedTrades.length;
  const averageProfitPerTrade = totalTrades > 0 ? totalProfit / totalTrades : 0;
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

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end text-xs md:flex-row md:items-center md:gap-4 md:text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">Capital Inicial: </span>
              <span className="font-semibold">
                {formatCurrency(initialCapital)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Capital Atual: </span>
              <span className="font-semibold">
                {formatCurrency(currentCapital)}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Sair">
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 bg-gray-50 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Dashboard
          </h2>
          <Button onClick={() => setIsTradeModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Novo Trade
          </Button>
        </div>

        {/* Métricas e Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Capital Inicial</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingCapital(!isEditingCapital)}
                    className="h-8 w-8"
                  >
                    {isEditingCapital ? (
                      <span className="text-xs">Cancelar</span>
                    ) : (
                      <Edit size={14} />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingCapital ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={tempCapital}
                      onChange={(e) => setTempCapital(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button onClick={handleSaveCapital}>Salvar</Button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatCurrency(initialCapital)}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Métricas Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Resultado Total:
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      totalProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Lucro médio por trade:
                  </span>
                  <span
                    className={`font-medium ${
                      averageProfitPerTrade >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(averageProfitPerTrade)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Total de Trades:
                  </span>
                  <span className="font-medium">{totalTrades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa de Acerto:</span>
                  <span className="font-medium">{winRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Gráfico de Lucro Cumulativo</CardTitle>
              </CardHeader>
              <CardContent>
                <CumulativeProfitChart trades={positions} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Histórico de trades */}
        <div className="mt-6">
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
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
      </main>

      {/* Modal para adicionar novo trade */}
      <Modal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        title={currentTrade ? "Editar Trade" : "Adicionar Trade"}
      >
        <TradeForm
          onAddTrade={handleAddTrade}
          onCancel={() => setIsTradeModalOpen(false)}
          initialData={currentTrade}
        />
      </Modal>

      {/* Modal para detalhes/edição do trade */}
      {selectedPosition && (
        <TradeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          position={selectedPosition}
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

      {tradeToDelete && (
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={() => {
            handleDeleteTrade(tradeToDelete.id!);
            setTradeToDelete(null);
          }}
          title="Confirmar Exclusão"
          message="Tem certeza de que deseja excluir este trade?"
        />
      )}
    </div>
  );
};

export default DashboardPage;
