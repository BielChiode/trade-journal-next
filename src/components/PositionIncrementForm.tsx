import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import ButtonLoader from './ui/ButtonLoader';
import { Input } from './ui/Input';
import Calendar from 'react-calendar';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface PositionIncrementFormProps {
  onSubmit: (data: { incrementQuantity: number; incrementPrice: number; incrementDate: Date }) => Promise<void>;
  onCancel: () => void;
  currentQuantity: number;
}

const PositionIncrementForm: React.FC<PositionIncrementFormProps> = ({ onSubmit, onCancel, currentQuantity }) => {
  const [incrementQuantity, setIncrementQuantity] = useState<number | ''>('');
  const [incrementPrice, setIncrementPrice] = useState<number | ''>('');
  const [incrementDate, setIncrementDate] = useState<Date>(new Date());
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
      setIncrementDate(date);
    }
    setShowCalendar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incrementQuantity || !incrementPrice || !incrementDate) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    if (incrementQuantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        incrementQuantity: Number(incrementQuantity),
        incrementPrice: Number(incrementPrice),
        incrementDate,
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
          value={incrementQuantity}
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
            value={incrementPrice}
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
              value={incrementDate.toLocaleDateString('pt-BR')}
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
                  value={incrementDate}
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