import apiClient from "./apiClient";
import { Position, Operation } from "../types/trade";
import { PositionFormData } from "@/components/PositionForm";

// Função helper para transformar os campos de data de string para Date
const transformPositionDates = (position: Position): Position => ({
  ...position,
  initial_entry_date: new Date(position.initial_entry_date),
  last_exit_date: position.last_exit_date ? new Date(position.last_exit_date) : undefined,
});

// Função helper para transformar os campos de data de uma operação
const transformOperationDates = (operation: Operation): Operation => ({
  ...operation,
  date: new Date(operation.date),
});

// Tipagem para a criação de uma nova posição, que não precisa de todos os campos de uma Posição
type CreatePositionData = {
  ticker: string;
  type: "Buy" | "Sell";
  entry_date: string;
  entry_price: number;
  quantity: number;
  observations?: string;
};

export const getPositions = async (): Promise<Position[]> => {
  // A API retorna posições com datas como strings.
  // Fazemos o cast para 'any' para poder mapear e transformar.
  const { data: positions } = await apiClient.get<any[]>("/trades");
  return positions.map(transformPositionDates as (pos: any) => Position);
};

export const addPosition = (positionData: CreatePositionData) =>
  apiClient.post<{ positionId: number }>("/trades", positionData);

export const updatePosition = (positionId: number, data: PositionFormData) =>
  apiClient.put(`/trades/${positionId}`, data);

export const getOperationsByPositionId = async (positionId: number): Promise<Operation[]> => {
  const { data: operations } = await apiClient.get<any[]>(`/positions/${positionId}/operations`);
  return operations.map(transformOperationDates as (op: any) => Operation);
};

export const deletePosition = (positionId: number) =>
  apiClient.delete<void>(`/trades/${positionId}`);

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
