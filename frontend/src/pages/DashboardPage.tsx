import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { getTrades, addTrade, updateTrade, deleteTrade } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import CumulativeProfitChart from '../components/CumulativeProfitChart';
import TradeCard from '../components/TradeCard';
import TradeForm from '../components/TradeForm';
import TradeDetailsModal from '../components/TradeDetailsModal';
import { Trade } from '../types/trade';

const DashboardPage: React.FC = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
    const [startInEditMode, setStartInEditMode] = useState<boolean>(false);

    useEffect(() => {
        loadTrades();
    }, []);

    const loadTrades = async () => {
        try {
            const response = await getTrades();
            setTrades(response.data);
        } catch (error) {
            console.error("Failed to load trades:", error);
        }
    };

    const handleAddTrade = async (tradeData: Trade) => {
        try {
            let resultado = 0;
            if (tradeData.preco_entrada && tradeData.preco_saida && tradeData.quantidade) {
                const entrada = tradeData.preco_entrada;
                const saida = tradeData.preco_saida;
                const quantidade = tradeData.quantidade;
                
                if (tradeData.tipo === 'Compra') {
                    resultado = (saida - entrada) * quantidade;
                } else {
                    resultado = (entrada - saida) * quantidade;
                }
            }

            const tradeWithResult = {
                ...tradeData,
                resultado
            };

            await addTrade(tradeWithResult);
            setIsModalOpen(false);
            loadTrades();
        } catch (error) {
            console.error("Erro ao adicionar trade:", error);
            throw error;
        }
    };

    const handleUpdateTrade = async (tradeId: number, tradeData: Trade) => {
        try {
            let resultado = 0;
            if (tradeData.preco_entrada && tradeData.preco_saida && tradeData.quantidade) {
                const entrada = tradeData.preco_entrada;
                const saida = tradeData.preco_saida;
                const quantidade = tradeData.quantidade;
                
                if (tradeData.tipo === 'Compra') {
                    resultado = (saida - entrada) * quantidade;
                } else {
                    resultado = (entrada - saida) * quantidade;
                }
            }

            const tradeWithResult = {
                ...tradeData,
                resultado
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

    const handleTradeClick = (trade: Trade) => {
        setSelectedTrade(trade);
        setStartInEditMode(false);
        setIsDetailsModalOpen(true);
    };

    const handleAddExitPrice = (trade: Trade) => {
        setSelectedTrade(trade);
        setStartInEditMode(true);
        setIsDetailsModalOpen(true);
    };

    const totalProfit = trades.reduce((acc, trade) => acc + (Number(trade.resultado) || 0), 0);
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (trades.filter(t => (t.resultado ?? 0) > 0).length / totalTrades) * 100 : 0;

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header responsivo */}
            <header className="sticky top-0 z-10 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 border-b shrink-0 bg-background">
                <h1 className="text-base sm:text-lg font-semibold truncate">Trade Journal</h1>
                <Button 
                    onClick={() => setIsModalOpen(true)}
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
                            <CardTitle className="text-xs sm:text-sm font-medium">Lucro Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-lg sm:text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                R$ {totalProfit.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs sm:text-sm font-medium">Taxa de Acerto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg sm:text-2xl font-bold">{winRate.toFixed(1)}%</div>
                        </CardContent>
                    </Card>
                    <Card className="sm:col-span-2 lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs sm:text-sm font-medium">Total de Trades</CardTitle>
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
                        <CumulativeProfitChart trades={trades} />
                    </div>

                    {/* Histórico de trades */}
                    <div className="order-1 xl:order-2">
                        <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-bold">Histórico de Trades</h2>
                        <div className="max-h-[520px] sm:max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                {trades.length > 0 ? (
                                    trades.map(trade => (
                                        <TradeCard 
                                            key={trade.id} 
                                            trade={trade} 
                                            onClick={handleTradeClick}
                                            onAddExitPrice={handleAddExitPrice}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8 text-gray-500">
                                        <p>Nenhum trade encontrado.</p>
                                        <p className="text-sm mt-1">Clique em "Novo Trade" para começar.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal para adicionar novo trade */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Adicionar Novo Trade"
            >
                <TradeForm
                    onAddTrade={handleAddTrade}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Modal para detalhes/edição do trade */}
            <TradeDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                trade={selectedTrade}
                onUpdateTrade={handleUpdateTrade}
                onDeleteTrade={handleDeleteTrade}
                startInEditMode={startInEditMode}
            />
        </div>
    );
};

export default DashboardPage; 