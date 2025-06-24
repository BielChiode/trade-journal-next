import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { PositionSummary } from '@/lib/tradeUtils';
import { Trade } from '@prisma/client';
import TradeCard from '@/components/TradeCard';

interface TradesHistoryProps {
    setCurrentTrade: (trade: Trade | null) => void;
    setIsTradeModalOpen: (isOpen: boolean) => void;
    isFilterActive: boolean;
    handleClearFilters: () => void;
    tickerSearch: string;
    setTickerSearch: (search: string) => void;
    statusFilter: 'all' | 'Open' | 'Closed';
    setStatusFilter: (status: 'all' | 'Open' | 'Closed') => void;
    resultFilter: 'all' | 'profit' | 'loss';
    setResultFilter: (result: 'all' | 'profit' | 'loss') => void;
    filteredPositions: PositionSummary[];
    setSelectedPosition: (position: PositionSummary | null) => void;
    setStartInEditMode: (isEditing: boolean) => void;
    setIsDetailsModalOpen: (isOpen: boolean) => void;
}

const TradesHistory: React.FC<TradesHistoryProps> = ({
    setCurrentTrade,
    setIsTradeModalOpen,
    isFilterActive,
    handleClearFilters,
    tickerSearch,
    setTickerSearch,
    statusFilter,
    setStatusFilter,
    resultFilter,
    setResultFilter,
    filteredPositions,
    setSelectedPosition,
    setStartInEditMode,
    setIsDetailsModalOpen
}) => {
    const handleTradeClick = (position: PositionSummary) => {
        setSelectedPosition(position);
        setStartInEditMode(false);
        setIsDetailsModalOpen(true);
    };

    return (
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
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                            placeholder="Buscar ticker..."
                            value={tickerSearch}
                            onChange={(e) => setTickerSearch(e.target.value)}
                            className="pl-8 w-32 h-9"
                        />
                    </div>
                    <div className="flex items-center p-1 bg-muted rounded-lg">
                        <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')} className="h-7">Todos</Button>
                        <Button variant={statusFilter === 'Open' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('Open')} className="h-7">Abertos</Button>
                        <Button variant={statusFilter === 'Closed' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('Closed')} className="h-7">Fechados</Button>
                    </div>
                    <div className="flex items-center p-1 bg-muted rounded-lg">
                        <Button variant={resultFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setResultFilter('all')} className="h-7">Resultado</Button>
                        <Button
                            variant={'ghost'}
                            size="sm"
                            onClick={() => setResultFilter('profit')}
                            className={cn("h-7", {
                                "bg-green-100 text-green-700 font-semibold dark:bg-green-500/20 dark:text-green-400": resultFilter === 'profit',
                                "text-green-600 dark:text-green-500 hover:bg-green-100 hover:text-green-700 hover:font-semibold dark:hover:bg-green-500/20 dark:hover:text-green-400": resultFilter !== 'profit',
                            })}
                        >
                            Lucro
                        </Button>
                        <Button
                            variant={'ghost'}
                            size="sm"
                            onClick={() => setResultFilter('loss')}
                            className={cn("h-7", {
                                "bg-red-100 text-red-700 font-semibold dark:bg-red-500/20 dark:text-red-400": resultFilter === 'loss',
                                "text-red-600 dark:text-red-500 hover:bg-red-100 hover:text-red-700 hover:font-semibold dark:hover:bg-red-500/20 dark:hover:text-red-400": resultFilter !== 'loss'
                            })}
                        >
                            Prejuízo
                        </Button>
                    </div>
                </div>
            </div>
            <div className="max-h-[520px] sm:max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
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