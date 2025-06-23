"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import {
  getTrades,
  addTrade,
  updateTrade,
  deletePosition,
  executePartialExit,
  incrementPosition,
} from "@/services/tradeService";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TradeForm from "@/components/TradeForm";
import TradeDetailsModal from "@/components/TradeDetailsModal";
import { Trade } from "@/types/trade";
import PartialExitForm from "@/components/PartialExitForm";
import { useAuth } from "@/contexts/AuthContext";
import PositionIncrementForm from "@/components/PositionIncrementForm";
import { PositionSummary, summarizePositions } from "@/lib/tradeUtils";
import DashboardHeader from "./components/DashboardHeader";
import DashboardMetrics from "./components/DashboardMetrics";
import TradesHistory from "./components/TradesHistory";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Loader from "@/components/ui/Loader";

const DashboardPage: React.FC = () => {
  const { logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states with localStorage initialization
  const [statusFilter, setStatusFilter] = useState<"all" | "Open" | "Closed">(
    () => {
      if (typeof window === "undefined") return "all";
      return (
        (localStorage.getItem("filter_status") as
          | "all"
          | "Open"
          | "Closed"
          | null) || "all"
      );
    }
  );
  const [tickerSearch, setTickerSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("filter_ticker") || "";
  });
  const [resultFilter, setResultFilter] = useState<"all" | "profit" | "loss">(
    () => {
      if (typeof window === "undefined") return "all";
      return (
        (localStorage.getItem("filter_result") as
          | "all"
          | "profit"
          | "loss"
          | null) || "all"
      );
    }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  const loadTrades = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getTrades();
      console.log("response", response.data);
      const summarized = summarizePositions(response.data);
      setPositions(summarized);
    } catch (error) {
      console.error("Erro ao carregar trades:", error);
    }
  }, [isAuthenticated]);

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
    localStorage.setItem("filter_status", statusFilter);
    localStorage.setItem("filter_ticker", tickerSearch);
    localStorage.setItem("filter_result", resultFilter);
  }, [statusFilter, tickerSearch, resultFilter]);

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
      if (
        resultFilter !== "all" &&
        ((resultFilter === "profit" && position.totalRealizedProfit < 0) ||
          (resultFilter === "loss" && position.totalRealizedProfit >= 0))
      ) {
        return false;
      }
      return true;
    });
  }, [positions, statusFilter, tickerSearch, resultFilter]);

  const totalProfit = useMemo(
    () =>
      positions
        .filter((p) => p.status === "Closed")
        .reduce((acc, p) => acc + p.totalRealizedProfit, 0),
    [positions]
  );

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

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
          (p: PositionSummary) => p.id === selectedPosition.id
        );
        setSelectedPosition(updatedSelectedPosition || null);
      }
    } catch (error) {
      console.error("Erro ao atualizar trade:", error);
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
          (p: PositionSummary) => p.id === selectedPosition.id
        );
        setSelectedPosition(updatedSelectedPosition || null);
      }

      setTradeForPartialExit(null);
      setIsDetailsModalOpen(true);
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
          (p: PositionSummary) => p.id === selectedPosition.id
        );
        setSelectedPosition(updatedSelectedPosition || null);
      }

      setTradeForIncrement(null);
      setIsDetailsModalOpen(true);
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

  const currentCapital = initialCapital + totalProfit;

  const handleOpenPartialExitModal = (trade: Trade) => {
    setTradeForPartialExit(trade);
    setIsPartialExitModalOpen(true);
    setIsDetailsModalOpen(false);
  };
  const handleOpenIncrementModal = (trade: Trade) => {
    setTradeForIncrement(trade);
    setIsIncrementModalOpen(true);
    setIsDetailsModalOpen(false);
  };
  const isFilterActive =
    statusFilter !== "all" || tickerSearch !== "" || resultFilter !== "all";

  const handleDeleteClick = () => {
    setIsDetailsModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPosition) return;
    try {
      setIsDeleting(true);
      await deletePosition(selectedPosition.id!);
      const response = await getTrades();
      const newPositions = summarizePositions(response.data);
      setPositions(newPositions);
    } catch (error) {
      console.error("Erro ao excluir trade:", error);
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
      setIsDetailsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        logout={logout}
        initialCapital={initialCapital}
        currentCapital={currentCapital}
      />

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 bg-background overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
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
          onOpenPartialExit={handleOpenPartialExitModal}
          onOpenIncrement={handleOpenIncrementModal}
          onDeleteClick={handleDeleteClick}
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

      {tradeForIncrement && (
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
    </div>
  );
};

export default DashboardPage;
