import React, { useState, useEffect } from 'react';
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import Modal from './ui/Modal';
import TradeForm from './TradeForm';
import { Button } from './ui/Button';
import ConfirmationModal from './ui/ConfirmationModal';
import { Trade } from '../types/trade';

interface TradeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trade: Trade | null;
    onUpdateTrade: (id: number, trade: Trade) => Promise<void>;
    onDeleteTrade: (id: number) => Promise<void>;
    startInEditMode?: boolean;
}

const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({ isOpen, onClose, trade, onUpdateTrade, onDeleteTrade, startInEditMode = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsEditing(startInEditMode);
        } else {
            // Reset state when modal is closed to prevent flashes
            setTimeout(() => {
                setIsEditing(false);
                setIsConfirmModalOpen(false);
            }, 200);
        }
    }, [isOpen, startInEditMode]);

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
            console.error('Erro ao atualizar trade:', error);
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
            console.error('Erro ao excluir trade:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const resultado = parseFloat(String(trade.resultado)) || 0;
    const isProfit = resultado > 0;

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
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full self-start sm:self-auto ${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span className="font-semibold">
                                R$ {resultado.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Informações básicas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-600">Tipo</label>
                            <p className="text-base sm:text-lg">{trade.tipo}</p>
                        </div>
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-600">Quantidade</label>
                            <p className="text-base sm:text-lg">{trade.quantidade}</p>
                        </div>
                    </div>

                    {/* Preços e datas de entrada */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-600">Data de Entrada</label>
                            <p className="text-base sm:text-lg">{new Date(trade.data_entrada).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-600">Preço de Entrada</label>
                            <p className="text-base sm:text-lg">R$ {parseFloat(String(trade.preco_entrada)).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Preços e datas de saída (se existirem) */}
                    {(trade.data_saida || trade.preco_saida) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-600">Data de Saída</label>
                                <p className="text-base sm:text-lg">
                                    {trade.data_saida ? new Date(trade.data_saida).toLocaleDateString('pt-BR') : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-600">Preço de Saída</label>
                                <p className="text-base sm:text-lg">
                                    {trade.preco_saida ? `R$ ${parseFloat(String(trade.preco_saida)).toFixed(2)}` : '-'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Setup */}
                    {trade.setup && (
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-600">Setup</label>
                            <p className="text-base sm:text-lg break-words">{trade.setup}</p>
                        </div>
                    )}

                    {/* Observações */}
                    {trade.observacoes && (
                        <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-600">Observações</label>
                            <p className="text-base sm:text-lg break-words whitespace-pre-wrap">{trade.observacoes}</p>
                        </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4 border-t">
                        <Button 
                            onClick={handleEdit} 
                            className="w-full sm:flex-1 order-2 sm:order-1" 
                            variant="outline"
                            disabled={isDeleting}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                        <Button 
                            onClick={handleDeleteClick} 
                            variant="destructive" 
                            className="w-full sm:flex-1 order-1 sm:order-2"
                            disabled={isDeleting}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este trade? Esta ação não pode ser desfeita."
                loading={isDeleting}
            />
        </>
    );
};

export default TradeDetailsModal; 