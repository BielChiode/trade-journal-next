import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/Button";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { Input } from "./ui/Input";
import { Position } from "@/types/trade";
import { searchTickers } from "@/services/tradeService";
import { useDebounce } from "@/hooks/useDebounce";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// A tipagem para os dados do formulário que será enviada
export type PositionFormData = {
  ticker: string;
  type: "Buy" | "Sell";
  date: string;
  price: number;
  quantity: number;
  setup?: string;
  observations?: string;
};

interface PositionFormProps {
  onSubmit: (data: PositionFormData) => Promise<void>;
  onClose: () => void;
  initialData?: Position | PositionFormData;
  isEditing?: boolean;
  isEditRestricted?: boolean;
}

const PositionForm: React.FC<PositionFormProps> = ({
  onSubmit,
  onClose,
  initialData,
  isEditing = false,
  isEditRestricted = false,
}) => {
  const [formData, setFormData] = useState<PositionFormData>({
    ticker: initialData?.ticker || "",
    type: initialData?.type || "Buy",
    date:
      (initialData as PositionFormData)?.date ||
      new Date().toISOString().split("T")[0],
    price: (initialData as PositionFormData)?.price || 0,
    quantity: (initialData as PositionFormData)?.quantity || 0,
    setup: initialData?.setup || "",
    observations: initialData?.observations || "",
  });

  const [tickerSuggestions, setTickerSuggestions] = useState<
    { symbol: string; instrument_name: string; exchange: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const tickerInputRef = useRef<HTMLDivElement>(null);
  const hasUserStartedTyping = useRef(false);
  const skipNextDebounce = useRef(false);

  const debouncedTicker = useDebounce(formData.ticker, 300);

  useEffect(() => {
    const fetchTickers = async () => {
      if (skipNextDebounce.current) {
        skipNextDebounce.current = false;
        return;
      }
      if (
        !hasUserStartedTyping.current ||
        isEditRestricted ||
        debouncedTicker.length < 2
      ) {
        setTickerSuggestions([]);
        return;
      }
      setIsSearching(true);
      const results = await searchTickers(debouncedTicker);
      setTickerSuggestions(results);
      setIsSearching(false);
    };
    fetchTickers();
  }, [debouncedTicker, isEditRestricted]);

  console.log(tickerSuggestions);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
      if (
        tickerInputRef.current &&
        !tickerInputRef.current.contains(event.target as Node)
      ) {
        setTickerSuggestions([]);
      }
    };
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
    if (e.target.name === "ticker" && !hasUserStartedTyping.current) {
      hasUserStartedTyping.current = true;
    }
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "quantity"
          ? parseFloat(value) || ""
          : value,
    }));
  };

  const handleTickerSelect = (ticker: {
    symbol: string;
    instrument_name: string;
    exchange: string;
  }) => {
    skipNextDebounce.current = true;
    setFormData((prev) => ({
      ...prev,
      ticker: ticker.symbol,
    }));
    setTickerSuggestions([]);
  };

  const handleDateChange = (value: Value) => {
    const newDate = Array.isArray(value) ? value[0] : value;
    if (newDate) {
      setFormData((prev) => ({
        ...prev,
        date: newDate.toISOString().split("T")[0],
      }));
    }
    setShowCalendar(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.quantity <= 0 || formData.price <= 0) {
      alert("Quantidade e Preço devem ser maiores que zero.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
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
          <div className="relative" ref={tickerInputRef}>
            <Input
              name="ticker"
              value={formData.ticker}
              onChange={handleChange}
              placeholder="Ex: PETR4"
              className="text-base sm:text-sm"
              required
              disabled={isEditRestricted}
              autoComplete="off"
            />
            {isSearching && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <ButtonLoader text="" />
              </div>
            )}
            {tickerSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {tickerSuggestions.map((s, index) => (
                  <li
                    key={`${s.symbol}-${index}`}
                    className="px-3 py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleTickerSelect(s)}
                  >
                    <p className="font-bold text-sm">{s.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.instrument_name}{" "}
                      {s.exchange && `(${s.exchange})`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Tipo *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isEditRestricted}
          >
            <option value="Buy">Compra</option>
            <option value="Sell">Venda</option>
          </select>
        </div>
      </div>

      {/* Date and Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Data *
          </label>
          <div className="relative">
            <Input
              type="text"
              name="date"
              value={formData.date}
              onFocus={() => !isEditRestricted && setShowCalendar(true)}
              readOnly
              className="cursor-pointer text-base sm:text-sm"
              required
              disabled={isEditRestricted}
            />
            {showCalendar && (
              <div ref={calendarRef} className="absolute z-10 mt-1">
                <Calendar
                  onChange={handleDateChange}
                  value={formData.date ? new Date(formData.date) : null}
                  locale="pt-BR"
                />
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Preço *
          </label>
          <Input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            className="text-base sm:text-sm"
            required
            disabled={isEditRestricted}
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
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="0"
          className="text-base sm:text-sm"
          required
          disabled={isEditRestricted}
        />
      </div>

      {/* Setup */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Setup
        </label>
        <Input
          name="setup"
          value={formData.setup ?? ""}
          onChange={handleChange}
          placeholder="Ex: Rompimento de Topo Histórico"
          className="text-base sm:text-sm"
        />
      </div>

      {/* Observations */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Observações
        </label>
        <textarea
          name="observations"
          value={formData.observations ?? ""}
          onChange={handleChange}
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <ButtonLoader text={isEditing ? "Salvando..." : "Criando..."} />
          ) : isEditing ? (
            "Salvar Alterações"
          ) : (
            "Criar Trade"
          )}
        </Button>
      </div>
    </form>
  );
};

export default PositionForm;
