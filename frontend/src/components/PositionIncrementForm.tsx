import React, { useState } from 'react';
import { Button } from './ui/Button';
import ButtonLoader from './ui/ButtonLoader';

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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantidade a Incrementar (Atual: {currentQuantity}) *
        </label>
        <input
          type="number"
          value={increment_quantity}
          onChange={(e) => setIncrementQuantity(Number(e.target.value) || '')}
          placeholder="Ex: 50"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Entrada *</label>
          <input
            type="number"
            step="0.01"
            value={increment_price}
            onChange={(e) => setIncrementPrice(Number(e.target.value) || '')}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrada *</label>
          <input
            type="date"
            value={increment_date}
            onChange={(e) => setIncrementDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
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