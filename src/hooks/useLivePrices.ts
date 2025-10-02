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

function writeToLocalStorage(positionId: number, price: number) {
  if (typeof window === "undefined") return;
  try {
    const payload: PositionPrice = { price, updatedAt: Date.now() };
    window.localStorage.setItem(LS_KEY_PREFIX + positionId, JSON.stringify(payload));
  } catch {}
}

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<number, PositionPrice>>({});
  const syncingRef = useRef<Record<number, boolean>>({});

  const getPrice = useCallback((positionId: number): number | undefined => {
    const mem = prices[positionId]?.price;
    if (typeof mem === "number") return mem;
    return readFromLocalStorage(positionId);
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
      const backend = await getPositionLastPrice(positionId);
      if (backend && Number.isFinite(backend) && backend > 0) {
        setPrices(prev => ({ ...prev, [positionId]: { price: backend, updatedAt: Date.now() } }));
        writeToLocalStorage(positionId, backend);
      }
    } finally {
      syncingRef.current[positionId] = false;
    }
  }, []);

  const persistToBackend = useCallback(async (positionId: number, price: number) => {
    try {
      await setPositionLastPrice(positionId, price);
    } catch (e) {
      // falha silenciosa; valor segue no estado/localStorage
      console.error("Falha ao persistir last_price:", e);
    }
  }, []);

  return useMemo(() => ({ getPrice, setPrice, syncFromBackend, persistToBackend }), [getPrice, setPrice, syncFromBackend, persistToBackend]);
}


