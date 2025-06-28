"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import {
  getPositions,
  addPosition,
  deletePosition,
} from "@/services/tradeService";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PositionDetailsModal from "@/components/PositionDetailsModal";
import { Position } from "@/types/trade";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "./components/DashboardHeader";
import DashboardMetrics from "./components/DashboardMetrics";
import PositionsHistory from "./components/PositionsHistory";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Loader from "@/components/ui/Loader";
import PositionForm, { PositionFormData } from "@/components/PositionForm";

const DashboardPage: React.FC = () => {
  const { logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedCapital = localStorage.getItem("initialCapital");
      return savedCapital ? parseFloat(savedCapital) : 10000;
    }
    return 10000;
  });
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapital, setTempCapital] = useState<number>(initialCapital);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPositionsLoading, setIsPositionsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<"all" | "Open" | "Closed">(
    "all"
  );
  const [tickerSearch, setTickerSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "profit" | "loss">(
    "all"
  );

  useEffect(() => {
    setStatusFilter((localStorage.getItem("filter_status") as any) || "all");
    setTickerSearch(localStorage.getItem("filter_ticker") || "");
    setResultFilter((localStorage.getItem("filter_result") as any) || "all");
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  const loadPositions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getPositions();
      setPositions(response);

      setSelectedPosition((currentSelected) => {
        if (!currentSelected) return null;
        const updatedPosition = response.find(
          (p) => p.id === currentSelected.id
        );
        return updatedPosition || null;
      });
    } catch (error) {
      console.error("Erro ao carregar posições:", error);
    } finally {
      setIsPositionsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPositions();
    const savedCapital = localStorage.getItem("initialCapital");
    if (savedCapital) {
      const capitalValue = parseFloat(savedCapital);
      if (!isNaN(capitalValue)) {
        setInitialCapital(capitalValue);
        setTempCapital(capitalValue);
      }
    }
  }, [loadPositions]);

  useEffect(() => {
    localStorage.setItem("filter_status", statusFilter);
    localStorage.setItem("filter_ticker", tickerSearch);
    localStorage.setItem("filter_result", resultFilter);
  }, [statusFilter, tickerSearch, resultFilter]);

  useEffect(() => {
    setTempCapital(initialCapital);
  }, [initialCapital]);

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      if (statusFilter !== "all" && position.status !== statusFilter)
        return false;
      if (
        tickerSearch &&
        !position.ticker.toLowerCase().includes(tickerSearch.toLowerCase())
      )
        return false;
      if (
        resultFilter !== "all" &&
        ((resultFilter === "profit" && position.total_realized_pnl < 0) ||
          (resultFilter === "loss" && position.total_realized_pnl >= 0))
      )
        return false;
      return true;
    });
  }, [positions, statusFilter, tickerSearch, resultFilter]);

  const totalProfit = useMemo(() => {
    return positions
      .filter((pos) => pos.status === "Closed")
      .reduce((acc, pos) => acc + (pos.total_realized_pnl ?? 0), 0);
  }, [positions]);

  const isFilterActive =
    statusFilter !== "all" || tickerSearch !== "" || resultFilter !== "all";

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  const handleAddPosition = async (positionData: PositionFormData) => {
    try {
      setIsPositionsLoading(true);
      await addPosition(positionData);
      setIsTradeModalOpen(false);
      await loadPositions();
    } catch (error) {
      setIsPositionsLoading(false);
      console.error("Erro ao adicionar posição:", error);
      throw error;
    }
  };

  const handleDeletePosition = async () => {
    if (!selectedPosition) return;
    setIsDeleting(true);
    try {
      setIsPositionsLoading(true);
      await deletePosition(selectedPosition.id);
      await loadPositions();
      setIsConfirmModalOpen(false);
      setSelectedPosition(null);
    } catch (error) {
      console.error("Erro ao deletar posição", error);
    } finally {
      setIsDeleting(false);
      setIsPositionsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setTickerSearch("");
    setResultFilter("all");
  };

  const handleOpenNewTradeModal = () => {
    setIsTradeModalOpen(true);
  };

  const handleOpenDetailsModal = (position: Position) => {
    setSelectedPosition(position);
  };

  const handleOpenConfirmDeleteModal = (position: Position) => {
    setSelectedPosition(position);
    setIsConfirmModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedPosition(null);
  };

  return (
    <>
      <DashboardHeader logout={logout} />

      <main className="px-8 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Visão Geral</h2>
          <Button onClick={handleOpenNewTradeModal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Posição
          </Button>
        </div>

        {isPositionsLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : (
          <>
            <DashboardMetrics
              positions={positions}
              totalProfit={totalProfit}
              initialCapital={initialCapital}
              setInitialCapital={setInitialCapital}
              isEditingCapital={isEditingCapital}
              setIsEditingCapital={setIsEditingCapital}
              tempCapital={tempCapital}
              setTempCapital={setTempCapital}
            />

            <PositionsHistory
              positions={filteredPositions}
              onOpenDetails={handleOpenDetailsModal}
              onOpenNewTradeModal={handleOpenNewTradeModal}
              isFilterActive={isFilterActive}
              handleClearFilters={handleClearFilters}
              tickerSearch={tickerSearch}
              setTickerSearch={setTickerSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              resultFilter={resultFilter}
              setResultFilter={setResultFilter}
            />
          </>
        )}
      </main>

      {isTradeModalOpen && (
        <Modal
          isOpen={isTradeModalOpen}
          title="Adicionar Novo Trade"
          onClose={() => setIsTradeModalOpen(false)}
        >
          <PositionForm
            onSubmit={handleAddPosition}
            onClose={() => setIsTradeModalOpen(false)}
          />
        </Modal>
      )}

      {selectedPosition && (
        <PositionDetailsModal
          position={selectedPosition}
          onClose={handleCloseDetailsModal}
          onUpdate={loadPositions}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleDeletePosition}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir a posição do ticker ${selectedPosition?.ticker}? Toda a posição, incluindo parciais e incrementos, será removida.`}
          loading={isDeleting}
        />
      )}
    </>
  );
};

export default DashboardPage;
