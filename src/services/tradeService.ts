import apiClient from "./apiClient";
import { Trade } from "../types/trade";

export const getTrades = () => apiClient.get<Trade[]>("/trades");

export const addTrade = (trade: Trade) =>
  apiClient.post<Trade>("/trades", trade);

export const updateTrade = (id: number, trade: Trade) =>
  apiClient.put<Trade>(`/trades/${id}`, trade);

export const deletePosition = (id: number) =>
  apiClient.delete<void>(`/trades/${id}`);

export const getTradesByPositionId = (positionId: number) =>
  apiClient.get<Trade[]>(`/trades/position/${positionId}`);

export const executePartialExit = (
  tradeId: number,
  exitData: { exit_quantity: number; exit_price: number; exit_date: string }
) => {
  return apiClient.post<{ message: string }>(
    `/trades/${tradeId}/partial-exit`,
    exitData
  );
};

export const incrementPosition = (
  tradeId: number,
  incrementData: {
    increment_quantity: number;
    increment_price: number;
    increment_date: string;
  }
) => {
  return apiClient.post(`/trades/${tradeId}/increment-position`, incrementData);
};
