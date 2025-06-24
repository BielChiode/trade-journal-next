import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/Button";
import { Trade } from "@prisma/client";
import Calendar from "react-calendar";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { Input } from "./ui/Input";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface TradeFormProps {
  onAddTrade?: (trade: Omit<Trade, "id" | "positionId" | "userId" | "result">) => Promise<void>;
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
  const [trade, setTrade] = useState({
    ticker: initialData?.ticker || "",
    type: initialData?.type || "Buy",
    entryDate: initialData?.entryDate ? new Date(initialData.entryDate) : null,
    entryPrice: initialData?.entryPrice || 0,
    exitDate: initialData?.exitDate ? new Date(initialData.exitDate) : null,
    exitPrice: initialData?.exitPrice || 0,
    quantity: initialData?.quantity || 0,
    setup: initialData?.setup || "",
    observations: initialData?.observations || "",
  });

  const [loading, setLoading] = useState(false);
  const [showEntryCalendar, setShowEntryCalendar] = useState(false);
  const [showExitCalendar, setShowExitCalendar] = useState(false);

  const entryCalendarRef = useRef<HTMLDivElement>(null);
  const exitCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setTrade({
        ticker: initialData.ticker,
        type: initialData.type,
        entryDate: new Date(initialData.entryDate),
        entryPrice: Number(initialData.entryPrice) || 0,
        exitDate: initialData.exitDate ? new Date(initialData.exitDate) : null,
        exitPrice: Number(initialData.exitPrice) || 0,
        quantity: Number(initialData.quantity) || 0,
        setup: initialData.setup || "",
        observations: initialData.observations || "",
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
        name === "entryPrice" || name === "exitPrice" || name === "quantity"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleDateChange = (
    value: Value,
    fieldName: "entryDate" | "exitDate"
  ) => {
    const date = Array.isArray(value) ? value[0] : value;

    setTrade((prev) => ({
      ...prev,
      [fieldName]: date,
    }));

    if (fieldName === "entryDate") {
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
    if (!trade.entryDate) {
      alert("A data de entrada é obrigatória.");
      return;
    }

    setLoading(true);

    const tradePayload = {
      ticker: trade.ticker,
      type: trade.type,
      entryDate: trade.entryDate,
      entryPrice: Number(trade.entryPrice),
      exitDate: trade.exitDate,
      exitPrice: trade.exitPrice ? Number(trade.exitPrice) : null,
      quantity: Number(trade.quantity),
      setup: trade.setup,
      observations: trade.observations,
    };

    try {
      if (isEditing && onUpdateTrade && initialData) {
        await onUpdateTrade({ ...initialData, ...tradePayload });
      } else if (onAddTrade) {
        await onAddTrade(tradePayload);
        setTrade({
          ticker: "",
          type: "Buy",
          entryDate: null,
          entryPrice: 0,
          exitDate: null,
          exitPrice: 0,
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
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Ticker *
          </label>
          <Input
            name="ticker"
            value={trade.ticker}
            onChange={handleChange}
            placeholder="Ex: PETR4"
            className="text-base sm:text-sm"
            required
            disabled={loading || isPartiallyEditable}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Tipo *
          </label>
          <select
            name="type"
            value={trade.type}
            onChange={handleChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Data de Entrada *
          </label>
          <div className="relative">
            <Input
              type="text"
              name="entryDate"
              value={trade.entryDate ? trade.entryDate.toLocaleDateString('pt-BR') : ""}
              onFocus={() => setShowEntryCalendar(true)}
              readOnly
              className="cursor-pointer text-base sm:text-sm"
              required
              disabled={loading || isPartiallyEditable}
            />
            {showEntryCalendar && (
              <div ref={entryCalendarRef} className="absolute z-10 mt-1">
                <Calendar
                  onChange={(value) => handleDateChange(value, "entryDate")}
                  value={trade.entryDate}
                  locale="pt-BR"
                />
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Preço de Entrada *
          </label>
          <Input
            type="number"
            step="0.01"
            name="entryPrice"
            value={trade.entryPrice}
            onChange={handleChange}
            placeholder="0.00"
            className="text-base sm:text-sm"
            required
            disabled={loading || isPartiallyEditable}
          />
        </div>
      </div>

      {/* Exit Date and Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Data de Saída
          </label>
          <div className="relative">
            <Input
              type="text"
              name="exitDate"
              value={trade.exitDate ? trade.exitDate.toLocaleDateString('pt-BR') : ""}
              onFocus={() => setShowExitCalendar(true)}
              readOnly
              className="cursor-pointer text-base sm:text-sm"
              disabled={loading || isPartiallyEditable}
            />
            {showExitCalendar && (
              <div ref={exitCalendarRef} className="absolute z-10 mt-1">
                <Calendar
                  onChange={(value) => handleDateChange(value, "exitDate")}
                  value={trade.exitDate}
                  locale="pt-BR"
                />
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Preço de Saída
          </label>
          <Input
            type="number"
            step="0.01"
            name="exitPrice"
            value={trade.exitPrice ?? ""}
            onChange={handleChange}
            placeholder="0.00"
            className="text-base sm:text-sm"
            disabled={loading}
          />
        </div>
      </div>
      
        {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Quantidade *
        </label>
        <Input
          type="number"
          step="1"
          name="quantity"
          value={trade.quantity}
          onChange={handleChange}
          placeholder="0"
          className="text-base sm:text-sm"
          required
          disabled={loading || (isEditing && !isPartiallyEditable)}
        />
      </div>


      {/* Setup and Observations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Setup
          </label>
          <Input
            name="setup"
            value={trade.setup ?? ""}
            onChange={handleChange}
            placeholder="Ex: Rompimento de topo"
            className="text-base sm:text-sm"
            disabled={loading}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Observações
          </label>
          <textarea
            name="observations"
            value={trade.observations ?? ""}
            onChange={handleChange}
            rows={4}
            placeholder="Descreva a sua estratégia, emoções, etc."
            className="block w-full rounded-md border-input bg-background shadow-sm focus:ring-ring focus:border-ring sm:text-sm p-2 border"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <ButtonLoader />
          ) : isEditing ? (
            "Salvar Alterações"
          ) : (
            "Adicionar Trade"
          )}
        </Button>
      </div>
    </form>
  );
};

export default TradeForm;
