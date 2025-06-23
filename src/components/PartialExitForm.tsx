import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import ButtonLoader from './ui/ButtonLoader';
import { Input } from './ui/Input';
import Calendar from 'react-calendar';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface PartialExitFormProps {
  onSubmit: (data: { exit_quantity: number; exit_price: number; exit_date: string }) => Promise<void>;
  onCancel: () => void;
  remainingQuantity: number;
}

const PartialExitForm: React.FC<PartialExitFormProps> = ({ onSubmit, onCancel, remainingQuantity }) => {
  const [exit_quantity, setExitQuantity] = useState<number | ''>('');
  const [exit_price, setExitPrice] = useState<number | ''>('');
  const [exit_date, setExitDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
      setExitDate(date.toISOString().split('T')[0]);
    }
    setShowCalendar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exit_quantity || !exit_price || !exit_date) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    if (exit_quantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }
    if (exit_quantity > remainingQuantity) {
      alert(`A quantidade não pode ser maior que a posição atual (${remainingQuantity}).`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        exit_quantity: Number(exit_quantity),
        exit_price: Number(exit_price),
        exit_date,
      });
    } catch (error) {
        console.error("Error on partial exit submission", error);
        // Opcional: mostrar um erro para o usuário
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Quantidade da Saída (Restante: {remainingQuantity}) *
        </label>
        <Input
          type="number"
          value={exit_quantity}
          onChange={(e) => setExitQuantity(Number(e.target.value) || '')}
          placeholder="Ex: 50"
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Preço de Saída *</label>
          <Input
            type="number"
            step="0.01"
            value={exit_price}
            onChange={(e) => setExitPrice(Number(e.target.value) || '')}
            placeholder="0.00"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Data de Saída *</label>
          <div className="relative">
            <Input
              type="text"
              value={exit_date}
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
                  value={exit_date ? new Date(exit_date) : null}
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
          {loading ? <ButtonLoader text="Salvando..." /> : 'Confirmar Saída'}
        </Button>
      </div>
    </form>
  );
};

export default PartialExitForm; 