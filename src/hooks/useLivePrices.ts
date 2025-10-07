import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPositionLastPrice, setPositionLastPrice } from "@/services/tradeService";

type PositionPrice = { price: number; updatedAt: number };

const LS_KEY_PREFIX = "livePrice:";

function readFromLocalStorage(positionId: number): number | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(LS_KEY_PREFIX + positionId);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PositionPrice;
    return typeof parsed?.price === "number" ? parsed.price : undefined;
  } catch {
    return undefined;
  }
}

function writeToLocalStorage(positionId: number, price: number, updatedAt?: number) {
  if (typeof window === "undefined") return;
  try {
    const payload: PositionPrice = { price, updatedAt: updatedAt || Date.now() };
    window.localStorage.setItem(LS_KEY_PREFIX + positionId, JSON.stringify(payload));
  } catch { }
}

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<number, PositionPrice>>({});
  const syncingRef = useRef<Record<number, boolean>>({});

  const getPrice = useCallback((positionId: number): number | undefined => {
    const mem = prices[positionId]?.price;
    if (typeof mem === "number") return mem;
    return readFromLocalStorage(positionId);
  }, [prices]);

  const getPriceUpdatedAt = useCallback((positionId: number): Date | undefined => {
    const mem = prices[positionId]?.updatedAt;
    if (typeof mem === "number") return new Date(mem);

    // Tentar buscar do localStorage
    if (typeof window === "undefined") return undefined;
    try {
      const raw = window.localStorage.getItem(LS_KEY_PREFIX + positionId);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as PositionPrice;
      return typeof parsed?.updatedAt === "number" ? new Date(parsed.updatedAt) : undefined;
    } catch {
      return undefined;
    }
  }, [prices]);

  const setPrice = useCallback((positionId: number, price: number) => {
    if (!Number.isFinite(price) || price <= 0) return;
    setPrices(prev => ({ ...prev, [positionId]: { price, updatedAt: Date.now() } }));
    writeToLocalStorage(positionId, price);
  }, []);

  const syncFromBackend = useCallback(async (positionId: number) => {
    if (syncingRef.current[positionId]) return;
    syncingRef.current[positionId] = true;
    try {
      const { price, updatedAt } = await getPositionLastPrice(positionId);
      if (price && Number.isFinite(price) && price > 0) {
        const currentPrice = prices[positionId];
        const backendUpdatedAt = updatedAt ? updatedAt.getTime() : (currentPrice?.updatedAt || Date.now());

        setPrices(prev => ({ ...prev, [positionId]: { price, updatedAt: backendUpdatedAt } }));
        writeToLocalStorage(positionId, price, backendUpdatedAt);
      }
    } finally {
      syncingRef.current[positionId] = false;
    }
  }, [prices]);

  const persistToBackend = useCallback(async (positionId: number, price: number) => {
    try {
      await setPositionLastPrice(positionId, price);
    } catch (e) {
      console.error("Falha ao persistir last_price:", e);
    }
  }, []);

  return useMemo(() => ({
    getPrice,
    getPriceUpdatedAt,
    setPrice,
    syncFromBackend,
    persistToBackend
  }), [getPrice, getPriceUpdatedAt, setPrice, syncFromBackend, persistToBackend]);
}


