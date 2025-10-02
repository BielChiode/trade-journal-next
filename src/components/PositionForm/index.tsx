import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../ui/Button";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { Input } from "../ui/Input";
import { Position } from "@/types/trade";
import { searchTickers } from "@/services/tradeService";
import { useDebounce } from "@/hooks/useDebounce";
import BracketOrderSection from "./BracketOrderSection";
import ExitSection from "./ExitSection";

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
  stop_gain?: number;
  stop_loss?: number;
  exit_price?: number;
  exit_date?: string;
  is_closed?: boolean;
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
    stop_gain: (initialData as PositionFormData)?.stop_gain || undefined,
    stop_loss: (initialData as PositionFormData)?.stop_loss || undefined,
    exit_price: (initialData as PositionFormData)?.exit_price || undefined,
    exit_date: (initialData as PositionFormData)?.exit_date || undefined,
    is_closed: (initialData as PositionFormData)?.is_closed || false,
  });

  const [isBracketOrder, setIsBracketOrder] = useState<boolean>(
    !!(initialData?.stop_gain || initialData?.stop_loss)
  );

  const [isClosedPosition, setIsClosedPosition] = useState<boolean>(
    !!((initialData as PositionFormData)?.exit_price || (initialData as PositionFormData)?.exit_date)
  );

  const [tickerSuggestions, setTickerSuggestions] = useState<
    { symbol: string; instrument_name: string; exchange: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showExitCalendar, setShowExitCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const exitCalendarRef = useRef<HTMLDivElement>(null);
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
        exitCalendarRef.current &&
        !exitCalendarRef.current.contains(event.target as Node)
      ) {
        setShowExitCalendar(false);
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
        name === "price" || name === "quantity" || name === "stop_gain" || name === "stop_loss" || name === "exit_price"
          ? value === "" ? "" : parseFloat(value) || 0
          : value,
    }));
  };

  const handleBracketOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsBracketOrder(checked);

    if (!checked) {
      // Limpar os campos quando desmarcar o checkbox
      setFormData((prev) => ({
        ...prev,
        stop_gain: undefined,
        stop_loss: undefined,
      }));
    }
  };

  const handleClosedPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsClosedPosition(checked);

    if (!checked) {
      // Limpar os campos quando desmarcar o checkbox
      setFormData((prev) => ({
        ...prev,
        exit_price: undefined,
        exit_date: undefined,
        is_closed: false,
      }));
    }
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

  const handleDateChange = (value: Value, isExitDate: boolean = false) => {
    const newDate = Array.isArray(value) ? value[0] : value;
    if (newDate) {
      const dateString = newDate.toISOString().split("T")[0];
      
      if (isExitDate) {
        setFormData((prev) => ({
          ...prev,
          exit_date: dateString,
        }));
        setShowExitCalendar(false);
      } else {
        setFormData((prev) => ({
          ...prev,
          date: dateString,
        }));
        setShowCalendar(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.quantity <= 0 || formData.price <= 0) {
      alert("Quantidade e Preço devem ser maiores que zero.");
      return;
    }

    // Validação para Ordem Bracket
    if (isBracketOrder) {
      if (!formData.stop_gain || !formData.stop_loss) {
        alert("Para usar Ordem Bracket, é necessário preencher Stop Gain e Stop Loss.");
        return;
      }
      if (formData.stop_gain <= 0 || formData.stop_loss <= 0) {
        alert("Stop Gain e Stop Loss devem ser maiores que zero.");
        return;
      }
    }

    // Validação para Posição Fechada
    if (isClosedPosition) {
      if (!formData.exit_price || !formData.exit_date) {
        alert("Para registrar saída, é necessário preencher Preço de Saída e Data de Saída.");
        return;
      }
      if (formData.exit_price <= 0) {
        alert("Preço de Saída deve ser maior que zero.");
        return;
      }
    }

    setLoading(true);
    try {
      // Remover stop_gain e stop_loss se não for Ordem Bracket
      let dataToSubmit = isBracketOrder ? formData : {
        ...formData,
        stop_gain: undefined,
        stop_loss: undefined,
      };

      // Remover campos de saída se não for posição fechada
      if (!isClosedPosition) {
        dataToSubmit = {
          ...dataToSubmit,
          exit_price: undefined,
          exit_date: undefined,
          is_closed: false,
        };
      } else {
        dataToSubmit = {
          ...dataToSubmit,
          is_closed: true,
        };
      }

      await onSubmit(dataToSubmit);
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
                  onChange={(value) => handleDateChange(value)}
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

      <BracketOrderSection
        isBracketOrder={isBracketOrder}
        onBracketOrderChange={handleBracketOrderChange}
        stopGain={formData.stop_gain}
        stopLoss={formData.stop_loss}
        onFieldChange={handleChange}
        isEditRestricted={isEditRestricted}
        allowStopsEdit={isEditing}
      />

      <ExitSection
        isClosedPosition={isClosedPosition}
        onClosedPositionChange={handleClosedPositionChange}
        exitPrice={formData.exit_price}
        exitDate={formData.exit_date}
        onFieldChange={handleChange}
        onDateChange={handleDateChange}
        showExitCalendar={showExitCalendar}
        onShowExitCalendar={setShowExitCalendar}
        exitCalendarRef={exitCalendarRef}
        isEditRestricted={isEditRestricted}
      />

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
