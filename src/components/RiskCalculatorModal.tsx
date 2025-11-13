"use client";

import React, { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { calculateMissingValue, RiskCalculatorInputs, OperationType } from "@/lib/riskCalculator";

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [inputs, setInputs] = useState<RiskCalculatorInputs>({
    operationType: 'buy',
    entryPrice: null,
    stopPrice: null,
    riskAmount: null,
    quantity: null
  });

  // Estado para armazenar valores como string durante a digitação
  const [inputStrings, setInputStrings] = useState({
    entryPrice: '',
    stopPrice: '',
    riskAmount: '',
    quantity: ''
  });

  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [calculatedField, setCalculatedField] = useState<'entryPrice' | 'stopPrice' | 'riskAmount' | 'quantity' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar números
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Função para limpar formatação e converter para número
  const parseInput = (value: string): number | null => {
    if (!value.trim()) return null;
    // Remove tudo exceto dígitos, vírgulas e pontos
    const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
  };

  // Função para formatar input de moeda
  const formatCurrencyInput = (value: string): string => {
    if (!value) return '';
    const num = parseInput(value);
    if (num === null) return value;
    return formatCurrency(num);
  };

  // Função para formatar input de número
  const formatNumberInput = (value: string): string => {
    if (!value) return '';
    const num = parseInput(value);
    if (num === null) return value;
    return formatNumber(num);
  };

  // Calcular automaticamente quando inputs mudarem
  useEffect(() => {
    const result = calculateMissingValue(inputs);

    if (result.success && result.value !== undefined) {
      setCalculatedValue(result.value);
      setError(null);

      // Identifica qual campo foi calculado
      const validation = calculateMissingValue(inputs);
      if (validation.success) {
        // Re-validar para encontrar o campo vazio
        const { entryPrice, stopPrice, riskAmount, quantity } = inputs;
        if (entryPrice === null || entryPrice <= 0) setCalculatedField('entryPrice');
        else if (stopPrice === null || stopPrice <= 0) setCalculatedField('stopPrice');
        else if (riskAmount === null || riskAmount <= 0) setCalculatedField('riskAmount');
        else if (quantity === null || quantity <= 0) setCalculatedField('quantity');
      }
    } else {
      setCalculatedValue(null);
      setCalculatedField(null);
      setError(result.error || null);
    }
  }, [inputs]);

  const handleInputChange = (field: 'entryPrice' | 'stopPrice' | 'riskAmount' | 'quantity', value: string) => {
    // Atualiza o estado da string para permitir digitação livre
    setInputStrings(prev => ({
      ...prev,
      [field]: value
    }));

    // Converte para número apenas se válido
    const numValue = value.trim() === '' ? null : parseInput(value);

    setInputs(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleClear = () => {
    setInputs({
      operationType: 'buy',
      entryPrice: null,
      stopPrice: null,
      riskAmount: null,
      quantity: null
    });
    setInputStrings({
      entryPrice: '',
      stopPrice: '',
      riskAmount: '',
      quantity: ''
    });
    setCalculatedValue(null);
    setCalculatedField(null);
    setError(null);
  };

  const getInputValue = (field: 'entryPrice' | 'stopPrice' | 'riskAmount' | 'quantity'): string => {
    // Se o campo foi calculado, mostra o valor formatado
    if (calculatedField === field) {
      return getCalculatedValue();
    }

    // Senão, mostra o valor como string (permitindo digitação livre)
    return inputStrings[field];
  };

  const getCalculatedValue = (): string => {
    if (calculatedValue === null) return '';

    if (calculatedField === 'riskAmount') {
      return formatCurrency(calculatedValue);
    } else if (calculatedField === 'quantity') {
      return formatNumber(calculatedValue);
    } else {
      return formatCurrency(calculatedValue);
    }
  };

  const opIsBuy = inputs.operationType === 'buy';
  const headerClassName = opIsBuy
    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calculadora de Risco" headerClassName={headerClassName}>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Preencha 3 dos 4 campos abaixo para calcular automaticamente o valor restante.
        </div>

        {/* Seletor de Tipo de Operação */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Operação</label>
          <div className="flex gap-2">
            <Button
              variant={inputs.operationType === 'buy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputs(prev => ({ ...prev, operationType: 'buy' }))}
              className={`flex-1 ${inputs.operationType === 'buy' ? 'bg-blue-600 hover:bg-blue-600/90 text-white' : ''}`}
            >
              Compra
            </Button>
            <Button
              variant={inputs.operationType === 'sell' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputs(prev => ({ ...prev, operationType: 'sell' }))}
              className={`flex-1 ${inputs.operationType === 'sell' ? 'bg-red-600 hover:bg-red-600/90 text-white' : ''}`}
            >
              Venda
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {inputs.operationType === 'buy'
              ? "Para operações de compra: risco = (entrada - stop) × quantidade"
              : "Para operações de venda: risco = (stop - entrada) × quantidade"
            }
          </div>
        </div>

        {/* Preço de Entrada */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preço de Entrada (R$)</label>
          <Input
            type="text"
            placeholder="Ex: 50.00 ou 50,00"
            value={getInputValue('entryPrice')}
            onChange={(e) => handleInputChange('entryPrice', e.target.value)}
            className={calculatedField === 'entryPrice' ? 'bg-muted text-muted-foreground' : ''}
            readOnly={calculatedField === 'entryPrice'}
          />
        </div>

        {/* Preço de Stop */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preço de Stop (R$)</label>
          <Input
            type="text"
            placeholder="Ex: 45.00 ou 45,00"
            value={getInputValue('stopPrice')}
            onChange={(e) => handleInputChange('stopPrice', e.target.value)}
            className={calculatedField === 'stopPrice' ? 'bg-muted text-muted-foreground' : ''}
            readOnly={calculatedField === 'stopPrice'}
          />
        </div>

        {/* R$ para Arriscar */}
        <div className="space-y-2">
          <label className="text-sm font-medium">R$ para Arriscar</label>
          <Input
            type="text"
            placeholder="Ex: 500.00 ou 500,00"
            value={getInputValue('riskAmount')}
            onChange={(e) => handleInputChange('riskAmount', e.target.value)}
            className={calculatedField === 'riskAmount' ? 'bg-muted text-muted-foreground' : ''}
            readOnly={calculatedField === 'riskAmount'}
          />
        </div>

        {/* Quantidade de Ações */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantidade de Ações</label>
          <Input
            type="text"
            placeholder="Ex: 100"
            value={getInputValue('quantity')}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            className={calculatedField === 'quantity' ? 'bg-muted text-muted-foreground' : ''}
            readOnly={calculatedField === 'quantity'}
          />
        </div>

        {/* Mensagem de erro ou resultado */}
        {error && (
          <div className="text-sm text-destructive dark:text-red-300 bg-destructive/10 dark:bg-red-900/40 border border-destructive/30 dark:border-red-700 p-3 rounded-md">
            {error}
          </div>
        )}

        {calculatedValue !== null && !error && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <strong>Resultado calculado:</strong> {getCalculatedValue()}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpar
          </Button>
          <Button onClick={onClose} className="flex-1">
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RiskCalculatorModal;
