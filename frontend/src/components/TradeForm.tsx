import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Trade } from '../types/trade';

interface TradeFormProps {
    onAddTrade?: (trade: Trade) => Promise<void>;
    onUpdateTrade?: (trade: Trade) => Promise<void>;
    onCancel: () => void;
    initialData?: Trade | null;
    isEditing?: boolean;
}

const TradeForm: React.FC<TradeFormProps> = ({ onAddTrade, onUpdateTrade, onCancel, initialData = null, isEditing = false }) => {
    const [trade, setTrade] = useState<Trade>({
        ticker: '',
        tipo: 'Compra',
        data_entrada: '',
        preco_entrada: 0,
        data_saida: '',
        preco_saida: 0,
        quantidade: 0,
        setup: '',
        observacoes: ''
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTrade({
                ...initialData,
                preco_entrada: Number(initialData.preco_entrada) || 0,
                preco_saida: Number(initialData.preco_saida) || 0,
                quantidade: Number(initialData.quantidade) || 0,
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTrade(prev => ({ 
            ...prev, 
            [name]: (name === 'preco_entrada' || name === 'preco_saida' || name === 'quantidade') ? parseFloat(value) : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            if (isEditing && onUpdateTrade) {
                await onUpdateTrade(trade);
            } else if (onAddTrade) {
                await onAddTrade(trade);
                setTrade({
                    ticker: '', tipo: 'Compra', data_entrada: '', preco_entrada: 0,
                    data_saida: '', preco_saida: 0, quantidade: 0, setup: '', observacoes: ''
                });
            }
        } catch (error) {
            console.error('Erro ao salvar trade:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Ticker e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ticker *
                    </label>
                    <input 
                        name="ticker" 
                        value={trade.ticker} 
                        onChange={handleChange} 
                        placeholder="Ex: PETR4"
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo *
                    </label>
                    <select 
                        name="tipo" 
                        value={trade.tipo} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Compra">Compra</option>
                        <option value="Venda">Venda</option>
                    </select>
                </div>
            </div>

            {/* Data e Preço de Entrada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Entrada *
                    </label>
                    <input 
                        type="date" 
                        name="data_entrada" 
                        value={trade.data_entrada} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço de Entrada *
                    </label>
                    <input 
                        type="number" 
                        step="0.01"
                        name="preco_entrada" 
                        value={trade.preco_entrada} 
                        onChange={handleChange} 
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required 
                    />
                </div>
            </div>

            {/* Data e Preço de Saída */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Saída
                    </label>
                    <input 
                        type="date" 
                        name="data_saida" 
                        value={trade.data_saida ?? ''} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço de Saída
                    </label>
                    <input 
                        type="number" 
                        step="0.01"
                        name="preco_saida" 
                        value={trade.preco_saida ?? 0} 
                        onChange={handleChange} 
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Quantidade */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                </label>
                <input 
                    type="number" 
                    name="quantidade" 
                    value={trade.quantidade} 
                    onChange={handleChange} 
                    placeholder="100"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required 
                />
            </div>

            {/* Setup */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Setup
                </label>
                <input 
                    name="setup" 
                    value={trade.setup ?? ''} 
                    onChange={handleChange} 
                    placeholder="Ex: Rompimento de resistência"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Observações */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                </label>
                <textarea 
                    name="observacoes" 
                    value={trade.observacoes ?? ''} 
                    onChange={handleChange} 
                    placeholder="Adicione suas observações sobre o trade..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                <Button 
                    type="submit" 
                    className="w-full sm:flex-1 order-2 sm:order-1"
                    disabled={loading}
                >
                    {loading ? 'Salvando...' : isEditing ? 'Atualizar Trade' : 'Salvar Trade'}
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    className="w-full sm:flex-1 order-1 sm:order-2"
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
};

export default TradeForm; 