import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import ButtonLoader from './ui/ButtonLoader';
import { Input } from './ui/Input';
import Calendar from 'react-calendar';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface PositionIncrementFormProps {
  onSubmit: (data: { increment_quantity: number; increment_price: number; increment_date: string }) => Promise<void>;
  onCancel: () => void;
  currentQuantity: number;
}

const PositionIncrementForm: React.FC<PositionIncrementFormProps> = ({ onSubmit, onCancel, currentQuantity }) => {
  const [increment_quantity, setIncrementQuantity] = useState<number | ''>('');
  const [increment_price, setIncrementPrice] = useState<number | ''>('');
  const [increment_date, setIncrementDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
    const date = Array.isArray(value) ? value[0] : value;
    if (date) {
      setIncrementDate(date.toISOString().split('T')[0]);
    }
    setShowCalendar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!increment_quantity || !increment_price || !increment_date) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    if (increment_quantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        increment_quantity: Number(increment_quantity),
        increment_price: Number(increment_price),
        increment_date,
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
          value={increment_quantity}
          onChange={(e) => setIncrementQuantity(Number(e.target.value) || '')}
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
            value={increment_price}
            onChange={(e) => setIncrementPrice(Number(e.target.value) || '')}
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
              value={increment_date}
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
                  value={increment_date ? new Date(increment_date) : null}
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