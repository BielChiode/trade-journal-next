import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import ButtonLoader from './ui/ButtonLoader';
import { Input } from './ui/Input';
import Calendar from 'react-calendar';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface PositionIncrementFormProps {
  onSubmit: (data: { quantity: number; price: number; date: string }) => Promise<void>;
  onCancel: () => void;
  currentQuantity: number;
}

const PositionIncrementForm: React.FC<PositionIncrementFormProps> = ({ onSubmit, onCancel, currentQuantity }) => {
  const [quantity, setQuantity] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarRef]);

  const handleDateChange = (value: Value) => {
    const newDate = Array.isArray(value) ? value[0] : value;
    if (newDate) {
      setDate(newDate.toISOString().split('T')[0]);
    }
    setShowCalendar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !price || !date) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    if (quantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        quantity: Number(quantity),
        price: Number(price),
        date,
      });
    } catch (error) {
        console.error("Error on position increment submission", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Quantidade a Incrementar (Atual: {currentQuantity}) *
        </label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || '')}
          placeholder="Ex: 50"
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Preço de Entrada *</label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || '')}
            placeholder="0.00"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Data de Entrada *</label>
          <div className="relative">
            <Input
              type="text"
              value={date}
              onFocus={() => setShowCalendar(true)}
              readOnly
              className="cursor-pointer"
              required
              disabled={loading}
            />
            {showCalendar && (
              <div ref={calendarRef} className="absolute z-10 mt-1 right-0 sm:right-auto">
                <Calendar
                  onChange={handleDateChange}
                  value={date ? new Date(date) : null}
                  locale="pt-BR"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <ButtonLoader text="Salvando..." /> : 'Confirmar Incremento'}
        </Button>
      </div>
    </form>
  );
};

export default PositionIncrementForm; 