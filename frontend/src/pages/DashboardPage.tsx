import React, { useMemo } from "react";
import { PlusCircle, Plus, Edit, LogOut, Search } from "lucide-react";

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
import { formatCurrency } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import PositionIncrementForm from "../components/PositionIncrementForm";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { useDashboard } from "../hooks/useDashboard";
import { PositionSummary } from "../lib/tradeUtils";

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const {
    positions,
    filteredPositions,
    isTradeModalOpen,
    setIsTradeModalOpen,
    currentTrade,
    setCurrentTrade,
    selectedPosition,
    setSelectedPosition,
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    startInEditMode,
    setStartInEditMode,
    isPartialExitModalOpen,
    setIsPartialExitModalOpen,
    tradeForPartialExit,
    setTradeForPartialExit,
    initialCapital,
    isEditingCapital,
    setIsEditingCapital,
    tempCapital,
    setTempCapital,
    isIncrementModalOpen,
    setIsIncrementModalOpen,
    tradeForIncrement,
    setTradeForIncrement,
    statusFilter,
    setStatusFilter,
    tickerSearch,
    setTickerSearch,
    resultFilter,
    setResultFilter,
    handleAddTrade,
    handleUpdateTrade,
    handleDeleteTrade,
    handlePartialExitSubmit,
    handleIncrementSubmit,
    handleSaveCapital,
    handleClearFilters,
    isFilterActive,
  } = useDashboard();

  const handleTradeClick = (position: PositionSummary) => {
    setSelectedPosition(position);
    setStartInEditMode(false);
    setIsDetailsModalOpen(true);
  };

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
                <CumulativeProfitChart positions={positions} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Histórico de trades */}
        <div className="mt-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-3">
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
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {isFilterActive && (
                <Button
                  variant="link"
                  onClick={handleClearFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar Filtros
                </Button>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ticker..."
                  value={tickerSearch}
                  onChange={(e) => setTickerSearch(e.target.value)}
                  className="pl-8 w-32 h-9"
                />
              </div>
              <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')} className="h-7">Todos</Button>
                <Button variant={statusFilter === 'Open' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('Open')} className="h-7">Abertos</Button>
                <Button variant={statusFilter === 'Closed' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('Closed')} className="h-7">Fechados</Button>
              </div>
              <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                <Button variant={resultFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setResultFilter('all')} className="h-7">Resultado</Button>
                <Button
                    variant={resultFilter === 'profit' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setResultFilter('profit')}
                    className={cn("h-7", {
                        "bg-green-100 text-green-700 font-semibold": resultFilter === 'profit',
                        "text-green-600": resultFilter !== 'profit',
                    })}
                >
                    Lucro
                </Button>
                <Button
                    variant={resultFilter === 'loss' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setResultFilter('loss')}
                    className={cn("h-7", {
                        "bg-red-100 text-red-700 font-semibold": resultFilter === 'loss',
                        "text-red-600": resultFilter !== 'loss'
                    })}
                >
                    Prejuízo
                </Button>
              </div>
            </div>
          </div>
          <div className="max-h-[520px] sm:max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredPositions.length > 0 ? (
                filteredPositions.map((position) => (
                  <TradeCard
                    key={position.id}
                    position={position}
                    onClick={() => handleTradeClick(position)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>Nenhum trade encontrado para os filtros selecionados.</p>
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
