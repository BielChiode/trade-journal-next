import axios, { AxiosResponse } from 'axios';
import { Trade } from '../types/trade';

const api = axios.create({
    baseURL: '/api' // O proxy no package.json cuidará do resto em desenvolvimento
});

export const getTrades = (): Promise<AxiosResponse<Trade[]>> => api.get('/trades');
export const addTrade = (trade: Trade): Promise<AxiosResponse<Trade>> => api.post('/trades', trade);
export const updateTrade = (id: number, trade: Trade): Promise<AxiosResponse<Trade>> => api.put(`/trades/${id}`, trade);
export const deleteTrade = (id: number): Promise<AxiosResponse<void>> => api.delete(`/trades/${id}`);

export const getTradesByPositionId = (positionId: number): Promise<AxiosResponse<Trade[]>> => {
    return api.get(`/trades/position/${positionId}`);
};

export const executePartialExit = (
    tradeId: number,
    exitData: { exit_quantity: number; exit_price: number; exit_date: string }
): Promise<AxiosResponse<{ message: string }>> => {
    return api.post(`/trades/${tradeId}/partial-exit`, exitData);
};
