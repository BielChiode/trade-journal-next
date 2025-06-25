import apiClient from "./apiClient";
import { Position, Operation } from "../types/trade";
import { PositionFormData } from "@/components/PositionForm";

// Tipagem para a criação de uma nova posição, que não precisa de todos os campos de uma Posição
type CreatePositionData = {
  ticker: string;
  type: "Buy" | "Sell";
  entry_date: string;
  entry_price: number;
  quantity: number;
  observations?: string;
};

export const getPositions = () => apiClient.get<Position[]>("/trades");

export const addPosition = (positionData: CreatePositionData) =>
  apiClient.post<{ positionId: number }>("/trades", positionData);

export const updatePosition = (positionId: number, data: PositionFormData) =>
  apiClient.put(`/trades/${positionId}`, data);

export const getOperationsByPositionId = (positionId: number) =>
  apiClient.get<Operation[]>(`/positions/${positionId}/operations`);

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
