import apiClient from "./apiClient";
import { Trade } from "@prisma/client";

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
  exitData: { exitQuantity: number; exitPrice: number; exitDate: Date }
) => {
  return apiClient.post<{ message: string }>(
    `/trades/${tradeId}/partial-exit`,
    exitData
  );
};

export const incrementPosition = (
  tradeId: number,
  incrementData: {
    incrementQuantity: number;
    incrementPrice: number;
    incrementDate: Date;
  }
) => {
  return apiClient.post(`/trades/${tradeId}/increment-position`, incrementData);
};
