import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Trade } from "../types/trade";

interface TradeFormProps {
  onAddTrade?: (trade: Trade) => Promise<void>;
  onUpdateTrade?: (trade: Trade) => Promise<void>;
  onCancel: () => void;
  initialData?: Trade | null;
  isEditing?: boolean;
}

const TradeForm: React.FC<TradeFormProps> = ({
  onAddTrade,
  onUpdateTrade,
  onCancel,
  initialData = null,
  isEditing = false,
}) => {
  const [trade, setTrade] = useState<Trade>({
    ticker: "",
    type: "Buy",
    entry_date: "",
    entry_price: 0,
    exit_date: "",
    exit_price: 0,
    quantity: 0,
    setup: "",
    observations: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTrade({
        ...initialData,
        entry_price: Number(initialData.entry_price) || 0,
        exit_price: Number(initialData.exit_price) || 0,
        quantity: Number(initialData.quantity) || 0,
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setTrade((prev) => ({
      ...prev,
      [name]:
        name === "entry_price" ||
        name === "exit_price" ||
        name === "quantity"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (trade.quantity <= 0) {
      alert("A quantidade do trade deve ser um número maior que zero.");
      return;
    }
    setLoading(true);

    try {
      if (isEditing && onUpdateTrade) {
        await onUpdateTrade(trade);
      } else if (onAddTrade) {
        await onAddTrade(trade);
        setTrade({
          ticker: "",
          type: "Buy",
          entry_date: "",
          entry_price: 0,
          exit_date: "",
          exit_price: 0,
          quantity: 0,
          setup: "",
          observations: "",
        });
      }
    } catch (error) {
      console.error("Error saving trade:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {/* Ticker and Type */}
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
            name="type"
            value={trade.type}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Buy">Compra</option>
            <option value="Sell">Venda</option>
          </select>
        </div>
      </div>

      {/* Entry Date and Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Entrada *
          </label>
          <input
            type="date"
            name="entry_date"
            value={trade.entry_date}
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
            name="entry_price"
            value={trade.entry_price}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Exit Date and Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Saída
          </label>
          <input
            type="date"
            name="exit_date"
            value={trade.exit_date ?? ""}
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
            name="exit_price"
            value={trade.exit_price ?? 0}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantidade *
        </label>
        <input
          type="number"
          name="quantity"
          value={trade.quantity}
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
          value={trade.setup ?? ""}
          onChange={handleChange}
          placeholder="Ex: Rompimento de resistência"
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Observations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          name="observations"
          value={trade.observations ?? ""}
          onChange={handleChange}
          placeholder="Adicione suas observações sobre o trade..."
          rows={3}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
        <Button
          type="submit"
          className="w-full sm:flex-1 order-2 sm:order-1"
          disabled={loading}
        >
          {loading
            ? "Salvando..."
            : isEditing
            ? "Atualizar Trade"
            : "Salvar Trade"}
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
