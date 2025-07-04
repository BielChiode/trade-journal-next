import apiClient from "./apiClient";
import { Position, Operation } from "../types/trade";

const transformPositionData = (position: any): Position => ({
  ...position,
  average_entry_price: parseFloat(position.average_entry_price),
  total_realized_pnl: parseFloat(position.total_realized_pnl),
  initial_entry_date: new Date(position.initial_entry_date),
  last_exit_date: position.last_exit_date
    ? new Date(position.last_exit_date)
    : undefined,
  operations: position.operations.map(transformOperationData),
});

const transformOperationData = (operation: any): Operation => ({
  ...operation,
  price: parseFloat(operation.price),
  result: operation.result ? parseFloat(operation.result) : null,
  date: new Date(operation.date),
});

type CreatePositionData = {
  ticker: string;
  type: "Buy" | "Sell";
  date: string;
  price: number;
  quantity: number;
  setup?: string;
  observations?: string;
};

export const getPositions = async (): Promise<Position[]> => {
  const { data: positions } = await apiClient.get<any[]>("/positions");
  return positions.map(transformPositionData);
};

export const addPosition = (positionData: CreatePositionData) =>
  apiClient.post("/positions", positionData);

export const updatePosition = (
  positionId: number,
  data: { setup?: string; observations?: string }
) => apiClient.put(`/positions/${positionId}`, data);

export const getOperationsByPositionId = async (
  positionId: number
): Promise<Operation[]> => {
  const { data: operations } = await apiClient.get<any[]>(
    `/positions/${positionId}/operations`
  );
  return operations.map(transformOperationData);
};

export const deletePosition = (positionId: number) =>
  apiClient.delete(`/positions/${positionId}`);

type IncrementData = {
  quantity: number;
  price: number;
  date: string;
};

export const incrementPosition = (positionId: number, data: IncrementData) =>
  apiClient.post(`/positions/${positionId}/increment`, data);

type PartialExitData = {
  quantity: number;
  price: number;
  date: string;
};

export const executePartialExit = (positionId: number, data: PartialExitData) =>
  apiClient.post(`/positions/${positionId}/partial-exit`, data);

export const searchTickers = async (
  symbol: string
): Promise<{ symbol: string; instrument_name: string; exchange: string }[]> => {
  if (!symbol) {
    return [];
  }
  try {
    const response = await apiClient.get(
      `/tickers?symbol=${encodeURIComponent(symbol)}`
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar tickers:", error);
    return [];
  }
};

export async function deleteOperation(
  positionId: string,
  operationId: string
): Promise<void> {
  try {
    const response = await apiClient.delete(
      `/positions/${positionId}/operations/${operationId}`
    );
    if (response.status !== 200) {
      const errorData = response.data;
      throw new Error(errorData.error || "Falha ao deletar operação");
    }
  } catch (error) {
    console.error("Erro ao deletar operação:", error);
    throw error;
  }
}
