import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/Button";
import Calendar from "react-calendar";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { Input } from "./ui/Input";
import { Position } from "@/types/trade";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// A tipagem para os dados do formulário que será enviada
export type PositionFormData = {
  ticker: string;
  type: "Buy" | "Sell";
  entry_date: string;
  entry_price: number;
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
  const isPosition = initialData && "status" in initialData;

  const [formData, setFormData] = useState<PositionFormData>({
    ticker: initialData?.ticker || "",
    type: initialData?.type || "Buy",
    entry_date: isPosition
      ? ((initialData as Position).initial_entry_date).toISOString().split("T")[0]
      : (initialData as PositionFormData)?.entry_date || new Date().toISOString().split("T")[0],
    entry_price: (initialData as Position)?.average_entry_price || (initialData as PositionFormData)?.entry_price || 0,
    quantity: isPosition
      ? ((initialData as Position).status === 'Closed'
          ? (initialData as Position).total_quantity
          : (initialData as Position).current_quantity) ?? 0
      : (initialData as PositionFormData)?.quantity || 0,
    setup: initialData?.setup || "",
    observations: initialData?.observations || "",
  });

  const [loading, setLoading] = useState(false);
  const [showEntryCalendar, setShowEntryCalendar] = useState(false);
  const entryCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        entryCalendarRef.current &&
        !entryCalendarRef.current.contains(event.target as Node)
      ) {
        setShowEntryCalendar(false);
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "entry_price" || name === "quantity"
          ? parseFloat(value) || ""
          : value,
    }));
  };

  const handleDateChange = (value: Value) => {
    const date = Array.isArray(value) ? value[0] : value;
    if (date) {
      setFormData((prev) => ({
        ...prev,
        entry_date: date.toISOString().split("T")[0],
      }));
    }
    setShowEntryCalendar(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.quantity <= 0 || formData.entry_price <= 0) {
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
          <Input
            name="ticker"
            value={formData.ticker}
            onChange={handleChange}
            placeholder="Ex: PETR4"
            className="text-base sm:text-sm"
            required
            disabled={isEditRestricted}
          />
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

      {/* Entry Date and Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Data de Entrada *
          </label>
          <div className="relative">
            <Input
              type="text"
              name="entry_date"
              value={formData.entry_date}
              onFocus={() => !isEditRestricted && setShowEntryCalendar(true)}
              readOnly
              className="cursor-pointer text-base sm:text-sm"
              required
              disabled={isEditRestricted}
            />
            {showEntryCalendar && (
              <div ref={entryCalendarRef} className="absolute z-10 mt-1">
                <Calendar
                  onChange={handleDateChange}
                  value={
                    formData.entry_date ? new Date(formData.entry_date) : null
                  }
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
            name="entry_price"
            value={formData.entry_price}
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
