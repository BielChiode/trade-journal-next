import React from "react";
import { Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Position } from "@/types/trade";
import PositionCard from "@/components/PositionCard";

interface TradesHistoryProps {
  positions: Position[];
  onOpenDetails: (position: Position) => void;
  onOpenNewTradeModal: () => void;

  // Props de filtro restauradas
  isFilterActive: boolean;
  handleClearFilters: () => void;
  tickerSearch: string;
  setTickerSearch: (search: string) => void;
  statusFilter: "all" | "Open" | "Closed";
  setStatusFilter: (status: "all" | "Open" | "Closed") => void;
  resultFilter: "all" | "profit" | "loss";
  setResultFilter: (result: "all" | "profit" | "loss") => void;
}

const TradesHistory: React.FC<TradesHistoryProps> = ({
  positions,
  onOpenDetails,
  onOpenNewTradeModal,
  isFilterActive,
  handleClearFilters,
  tickerSearch,
  setTickerSearch,
  statusFilter,
  setStatusFilter,
  resultFilter,
  setResultFilter,
}) => {
  return (
    <div className="mt-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Histórico de Trades</h2>
          <div
            className="flex items-center gap-2"
            title="Adicionar Trade"
          >
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onOpenNewTradeModal}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
          <div className="flex items-center p-1 bg-muted rounded-lg">
            <Button
              variant={statusFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-7"
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "Open" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("Open")}
              className="h-7"
            >
              Abertos
            </Button>
            <Button
              variant={statusFilter === "Closed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("Closed")}
              className="h-7"
            >
              Fechados
            </Button>
          </div>
          <div className="flex items-center p-1 bg-muted rounded-lg">
            <Button
              variant={resultFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setResultFilter("all")}
              className="h-7"
            >
              Resultado
            </Button>
            <Button
              variant={resultFilter === "profit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setResultFilter("profit")}
              className="h-7 text-green-600"
            >
              Lucro
            </Button>
            <Button
              variant={resultFilter === "loss" ? "default" : "ghost"}
              size="sm"
              onClick={() => setResultFilter("loss")}
              className="h-7 text-red-600"
            >
              Prejuízo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[520px] sm:max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {positions.length > 0 ? (
            positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onClick={() => onOpenDetails(position)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Nenhum trade encontrado para os filtros selecionados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradesHistory;
