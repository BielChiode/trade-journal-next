import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PlusCircle } from "lucide-react";
import {
  getTrades,
  addTrade,
  updateTrade,
  deleteTrade,
  executePartialExit,
  incrementPosition,
} from "../../services/tradeService";
import { Button } from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TradeForm from "../../components/TradeForm";
import TradeDetailsModal from "../../components/TradeDetailsModal";
import { Trade } from "../../types/trade";
import PartialExitForm from "../../components/PartialExitForm";
import { useAuth } from "../../contexts/AuthContext";
import PositionIncrementForm from "../../components/PositionIncrementForm";
import { PositionSummary, summarizePositions } from "../../lib/tradeUtils";
import DashboardHeader from "./components/DashboardHeader";
import DashboardMetrics from "./components/DashboardMetrics";
import TradesHistory from "./components/TradesHistory";

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null);
  const [selectedPosition, setSelectedPosition] =
    useState<PositionSummary | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [isPartialExitModalOpen, setIsPartialExitModalOpen] = useState(false);
  const [tradeForPartialExit, setTradeForPartialExit] = useState<Trade | null>(
    null
  );
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [tempCapital, setTempCapital] = useState<string>("0");
  const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);
  const [tradeForIncrement, setTradeForIncrement] = useState<Trade | null>(
    null
  );

  // Filter states with localStorage initialization
  const [statusFilter, setStatusFilter] = useState<"all" | "Open" | "Closed">(
    () => {
      return (localStorage.getItem('filter_status') as 'all' | 'Open' | 'Closed' | null) || 'all';
    }
  );
  const [tickerSearch, setTickerSearch] = useState(() => {
    return localStorage.getItem('filter_ticker') || '';
  });
  const [resultFilter, setResultFilter] = useState<'all' | 'profit' | 'loss'>(() => {
    return (localStorage.getItem('filter_result') as 'all' | 'profit' | 'loss' | null) || 'all';
  });

  const loadTrades = useCallback(async () => {
    try {
      const response = await getTrades();
      const summarized = summarizePositions(response.data);
      setPositions(summarized);
    } catch (error) {
      console.error("Erro ao carregar trades:", error);
    }
  }, []);

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
  }, [loadTrades]);

  // Effect to save filters to cache
  useEffect(() => {
    localStorage.setItem('filter_status', statusFilter);
    localStorage.setItem('filter_ticker', tickerSearch);
    localStorage.setItem('filter_result', resultFilter);
  }, [statusFilter, tickerSearch, resultFilter]);

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
      loadTrades();
    } catch (error) {
      console.error("Erro ao excluir trade:", error);
      throw error;
    }
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

      const response = await getTrades();
      const newPositions = summarizePositions(response.data);
      setPositions(newPositions);

      if (selectedPosition) {
        const updatedSelectedPosition = newPositions.find(
          (p) => p.id === selectedPosition.id
        );
        setSelectedPosition(updatedSelectedPosition || null);
      }

      setTradeForPartialExit(null);
    } catch (error) {
      console.error("Failed to execute partial exit", error);
    }
  };

  const handleIncrementSubmit = async (incrementData: {
    increment_quantity: number;
    increment_price: number;
    increment_date: string;
  }) => {
    if (!tradeForIncrement) return;
    try {
      await incrementPosition(tradeForIncrement.id!, incrementData);
      setIsIncrementModalOpen(false);

      const response = await getTrades();
      const newPositions = summarizePositions(response.data);
      setPositions(newPositions);

      if (selectedPosition) {
        const updatedSelectedPosition = newPositions.find(
          (p) => p.id === selectedPosition.id
        );
        setSelectedPosition(updatedSelectedPosition || null);
      }

      setTradeForIncrement(null);
    } catch (error) {
      console.error("Failed to increment position", error);
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

  const handleClearFilters = () => {
    setStatusFilter("all");
    setTickerSearch("");
    setResultFilter("all");
  };
  
  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      if (statusFilter !== "all" && position.status !== statusFilter) {
        return false;
      }
      if (
        tickerSearch &&
        !position.ticker.toLowerCase().includes(tickerSearch.toLowerCase())
      ) {
        return false;
      }
      if (resultFilter !== "all") {
        if (position.status === "Open") return false;
        if (resultFilter === "profit" && position.totalRealizedProfit <= 0) {
          return false;
        }
        if (resultFilter === "loss" && position.totalRealizedProfit > 0) {
          return false;
        }
      }
      return true;
    });
  }, [positions, statusFilter, tickerSearch, resultFilter]);
  
  const isFilterActive =
    statusFilter !== "all" || tickerSearch !== "" || resultFilter !== "all";

  const handleOpenPartialExitModal = (trade: Trade) => {
    setTradeForPartialExit(trade);
    setIsPartialExitModalOpen(true);
  };

  const handleOpenIncrementModal = (trade: Trade) => {
    setTradeForIncrement(trade);
    setIsIncrementModalOpen(true);
  };
  
  const closedTrades = positions.filter((p) => p.status === "Closed");
  const totalProfit = closedTrades.reduce(
    (acc, trade) => acc + (Number(trade.totalRealizedProfit) || 0),
    0
  );
  const currentCapital = initialCapital + totalProfit;

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader 
        initialCapital={initialCapital}
        currentCapital={currentCapital}
        logout={logout}
      />

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

        <DashboardMetrics
            isEditingCapital={isEditingCapital}
            setIsEditingCapital={setIsEditingCapital}
            tempCapital={tempCapital}
            setTempCapital={setTempCapital}
            handleSaveCapital={handleSaveCapital}
            initialCapital={initialCapital}
            positions={positions}
        />

        <TradesHistory
            setCurrentTrade={setCurrentTrade}
            setIsTradeModalOpen={setIsTradeModalOpen}
            isFilterActive={isFilterActive}
            handleClearFilters={handleClearFilters}
            tickerSearch={tickerSearch}
            setTickerSearch={setTickerSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            resultFilter={resultFilter}
            setResultFilter={setResultFilter}
            filteredPositions={filteredPositions}
            setSelectedPosition={setSelectedPosition}
            setStartInEditMode={setStartInEditMode}
            setIsDetailsModalOpen={setIsDetailsModalOpen}
        />
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
          onOpenIncrement={handleOpenIncrementModal}
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

      {isIncrementModalOpen && tradeForIncrement && (
        <Modal
          isOpen={isIncrementModalOpen}
          onClose={() => setIsIncrementModalOpen(false)}
          title={`Incrementar Posição em ${tradeForIncrement.ticker}`}
        >
          <PositionIncrementForm
            onSubmit={handleIncrementSubmit}
            onCancel={() => setIsIncrementModalOpen(false)}
            currentQuantity={tradeForIncrement.quantity}
          />
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
