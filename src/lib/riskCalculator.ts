export type OperationType = 'buy' | 'sell';

export interface RiskCalculatorInputs {
  operationType: OperationType;
  entryPrice: number | null;
  stopPrice: number | null;
  riskAmount: number | null;
  quantity: number | null;
}

export interface RiskCalculatorResult {
  success: boolean;
  value?: number;
  error?: string;
}

/**
 * Calcula a quantidade de ações baseada no risco
 */
export function calculateQuantity(
  entryPrice: number,
  stopPrice: number,
  riskAmount: number,
  operationType: OperationType
): RiskCalculatorResult {
  let priceDifference: number;
  
  if (operationType === 'buy') {
    // Para compra: risco = (entrada - stop) × quantidade
    priceDifference = entryPrice - stopPrice;
  } else {
    // Para venda: risco = (stop - entrada) × quantidade
    priceDifference = stopPrice - entryPrice;
  }
  
  if (priceDifference <= 0) {
    return {
      success: false,
      error: operationType === 'buy' 
        ? "O preço de entrada deve ser maior que o preço de stop"
        : "O preço de stop deve ser maior que o preço de entrada"
    };
  }
  
  if (riskAmount <= 0) {
    return {
      success: false,
      error: "O valor para arriscar deve ser maior que zero"
    };
  }
  
  const quantity = riskAmount / priceDifference;
  
  return {
    success: true,
    value: Math.floor(quantity) // Arredonda para baixo para ser conservador
  };
}

/**
 * Calcula o valor em R$ para arriscar
 */
export function calculateRiskAmount(
  entryPrice: number,
  stopPrice: number,
  quantity: number,
  operationType: OperationType
): RiskCalculatorResult {
  let priceDifference: number;
  
  if (operationType === 'buy') {
    // Para compra: risco = (entrada - stop) × quantidade
    priceDifference = entryPrice - stopPrice;
  } else {
    // Para venda: risco = (stop - entrada) × quantidade
    priceDifference = stopPrice - entryPrice;
  }
  
  if (priceDifference <= 0) {
    return {
      success: false,
      error: operationType === 'buy' 
        ? "O preço de entrada deve ser maior que o preço de stop"
        : "O preço de stop deve ser maior que o preço de entrada"
    };
  }
  
  if (quantity <= 0) {
    return {
      success: false,
      error: "A quantidade deve ser maior que zero"
    };
  }
  
  const riskAmount = priceDifference * quantity;
  
  return {
    success: true,
    value: riskAmount
  };
}

/**
 * Calcula o preço de stop baseado no risco
 */
export function calculateStopPrice(
  entryPrice: number,
  riskAmount: number,
  quantity: number,
  operationType: OperationType
): RiskCalculatorResult {
  if (entryPrice <= 0) {
    return {
      success: false,
      error: "O preço de entrada deve ser maior que zero"
    };
  }
  
  if (riskAmount <= 0) {
    return {
      success: false,
      error: "O valor para arriscar deve ser maior que zero"
    };
  }
  
  if (quantity <= 0) {
    return {
      success: false,
      error: "A quantidade deve ser maior que zero"
    };
  }
  
  let stopPrice: number;
  
  if (operationType === 'buy') {
    // Para compra: stop = entrada - (risco / quantidade)
    stopPrice = entryPrice - (riskAmount / quantity);
  } else {
    // Para venda: stop = entrada + (risco / quantidade)
    stopPrice = entryPrice + (riskAmount / quantity);
  }
  
  if (stopPrice <= 0) {
    return {
      success: false,
      error: "O preço de stop calculado seria negativo ou zero"
    };
  }
  
  return {
    success: true,
    value: stopPrice
  };
}

/**
 * Calcula o preço de entrada baseado no risco
 */
export function calculateEntryPrice(
  stopPrice: number,
  riskAmount: number,
  quantity: number,
  operationType: OperationType
): RiskCalculatorResult {
  if (stopPrice <= 0) {
    return {
      success: false,
      error: "O preço de stop deve ser maior que zero"
    };
  }
  
  if (riskAmount <= 0) {
    return {
      success: false,
      error: "O valor para arriscar deve ser maior que zero"
    };
  }
  
  if (quantity <= 0) {
    return {
      success: false,
      error: "A quantidade deve ser maior que zero"
    };
  }
  
  let entryPrice: number;
  
  if (operationType === 'buy') {
    // Para compra: entrada = stop + (risco / quantidade)
    entryPrice = stopPrice + (riskAmount / quantity);
  } else {
    // Para venda: entrada = stop - (risco / quantidade)
    entryPrice = stopPrice - (riskAmount / quantity);
  }
  
  return {
    success: true,
    value: entryPrice
  };
}

/**
 * Valida se exatamente 3 campos estão preenchidos
 */
export function validateInputs(inputs: RiskCalculatorInputs): {
  isValid: boolean;
  emptyField?: keyof RiskCalculatorInputs;
  error?: string;
} {
  const { entryPrice, stopPrice, riskAmount, quantity } = inputs;
  
  const filledFields = [
    entryPrice !== null && entryPrice > 0,
    stopPrice !== null && stopPrice > 0,
    riskAmount !== null && riskAmount > 0,
    quantity !== null && quantity > 0
  ].filter(Boolean).length;
  
  if (filledFields !== 3) {
    return {
      isValid: false,
      error: filledFields < 3 
        ? "Preencha exatamente 3 campos para calcular o 4º" 
        : "Todos os campos estão preenchidos. Deixe um vazio para calcular"
    };
  }
  
  // Identifica qual campo está vazio (excluindo operationType)
  let emptyField: keyof RiskCalculatorInputs | undefined;
  if (entryPrice === null || entryPrice <= 0) emptyField = 'entryPrice';
  else if (stopPrice === null || stopPrice <= 0) emptyField = 'stopPrice';
  else if (riskAmount === null || riskAmount <= 0) emptyField = 'riskAmount';
  else if (quantity === null || quantity <= 0) emptyField = 'quantity';
  
  return {
    isValid: true,
    emptyField
  };
}

/**
 * Calcula o valor faltante baseado nos inputs fornecidos
 */
export function calculateMissingValue(inputs: RiskCalculatorInputs): RiskCalculatorResult {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error
    };
  }
  
  const { operationType, entryPrice, stopPrice, riskAmount, quantity } = inputs;
  
  switch (validation.emptyField) {
    case 'quantity':
      return calculateQuantity(entryPrice!, stopPrice!, riskAmount!, operationType);
    
    case 'riskAmount':
      return calculateRiskAmount(entryPrice!, stopPrice!, quantity!, operationType);
    
    case 'stopPrice':
      return calculateStopPrice(entryPrice!, riskAmount!, quantity!, operationType);
    
    case 'entryPrice':
      return calculateEntryPrice(stopPrice!, riskAmount!, quantity!, operationType);
    
    default:
      return {
        success: false,
        error: "Erro interno: campo vazio não identificado"
      };
  }
}
