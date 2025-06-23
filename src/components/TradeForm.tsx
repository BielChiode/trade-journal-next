import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/Button";
import { Trade } from "../types/trade";
import Calendar from "react-calendar";
import ButtonLoader from "@/components/ui/ButtonLoader";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface TradeFormProps {
  onAddTrade?: (trade: Trade) => Promise<void>;
  onUpdateTrade?: (trade: Trade) => Promise<void>;
  onCancel: () => void;
  initialData?: Trade | null;
  isEditing?: boolean;
  isPartiallyEditable?: boolean;
}

const TradeForm: React.FC<TradeFormProps> = ({
  onAddTrade,
  onUpdateTrade,
  onCancel,
  initialData = null,
  isEditing = false,
  isPartiallyEditable = false,
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
  const [showEntryCalendar, setShowEntryCalendar] = useState(false);
  const [showExitCalendar, setShowExitCalendar] = useState(false);

  const entryCalendarRef = useRef<HTMLDivElement>(null);
  const exitCalendarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        entryCalendarRef.current &&
        !entryCalendarRef.current.contains(event.target as Node)
      ) {
        setShowEntryCalendar(false);
      }
      if (
        exitCalendarRef.current &&
        !exitCalendarRef.current.contains(event.target as Node)
      ) {
        setShowExitCalendar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setTrade((prev) => ({
      ...prev,
      [name]:
        name === "entry_price" || name === "exit_price" || name === "quantity"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleDateChange = (
    value: Value,
    fieldName: "entry_date" | "exit_date"
  ) => {
    const date = Array.isArray(value) ? value[0] : value;

    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      setTrade((prev) => ({
        ...prev,
        [fieldName]: formattedDate,
      }));
    }

    if (fieldName === "entry_date") {
      setShowEntryCalendar(false);
    } else {
      setShowExitCalendar(false);
    }
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
            disabled={loading || isPartiallyEditable}
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
            disabled={loading || isPartiallyEditable}
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
          <div className="relative">
            <input
              type="text"
              name="entry_date"
              value={trade.entry_date}
              onFocus={() => setShowEntryCalendar(true)}
              readOnly
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              required
              disabled={loading || isPartiallyEditable}
            />
            {showEntryCalendar && (
              <div ref={entryCalendarRef} className="absolute z-10 mt-1">
                <Calendar
                  onChange={(value) => handleDateChange(value, "entry_date")}
                  value={trade.entry_date ? new Date(trade.entry_date) : null}
                  locale="pt-BR"
                />
              </div>
            )}
          </div>
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
            disabled={loading || isPartiallyEditable}
          />
        </div>
      </div>

      {/* Exit Date and Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Saída
          </label>
          <div className="relative">
            <input
              type="text"
              name="exit_date"
              value={trade.exit_date ?? ""}
              onFocus={() => setShowExitCalendar(true)}
              readOnly
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              required
              disabled={loading || isPartiallyEditable}
            />
            {showExitCalendar && (
              <div ref={exitCalendarRef} className="absolute z-10 mt-1">
                <Calendar
                  onChange={(value) => handleDateChange(value, "exit_date")}
                  value={trade.exit_date ? new Date(trade.exit_date) : null}
                  locale="pt-BR"
                />
              </div>
            )}
          </div>
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
            disabled={loading || isPartiallyEditable}
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
          placeholder="0"
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={loading || isPartiallyEditable}
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
          disabled={loading}
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
          rows={3}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          disabled={loading}
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
        <Button
          type="submit"
          className="w-full sm:flex-1 order-2 sm:order-1"
          disabled={loading}
        >
          {loading ? (
            <ButtonLoader text={isEditing ? "Atualizando..." : "Salvando..."} />
          ) : isEditing ? (
            "Atualizar Trade"
          ) : (
            "Salvar Trade"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:flex-1 order-1 sm:order-2"
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default TradeForm;
