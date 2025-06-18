import axios, { AxiosResponse } from 'axios';
import { Trade } from '../types/trade';

const api = axios.create({
    baseURL: '/api' // O proxy no package.json cuidará do resto em desenvolvimento
});

export const getTrades = (): Promise<AxiosResponse<Trade[]>> => api.get('/trades');
export const addTrade = (trade: Trade): Promise<AxiosResponse<Trade>> => api.post('/trades', trade);
export const updateTrade = (id: number, trade: Trade): Promise<AxiosResponse<Trade>> => api.put(`/trades/${id}`, trade);
export const deleteTrade = (id: number): Promise<AxiosResponse<void>> => api.delete(`/trades/${id}`); 