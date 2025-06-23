import TradeModel from "@/models/trade";
import { Trade } from "@/types/trade";

export const findTradeById = (tradeId: number, userId: number): Promise<Trade> => {
  return new Promise((resolve, reject) => {
    TradeModel.findById(tradeId, userId, (err, trade) => {
      if (err) return reject(err);
      if (!trade) return reject(new Error("Trade not found"));
      resolve(trade);
    });
  });
};

export const createTrade = (trade: Trade, userId: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    TradeModel.create(trade, userId, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const updateTrade = (
  tradeId: number,
  data: Partial<Trade>,
  userId: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    TradeModel.update(tradeId, data, userId, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

export const deletePosition = (
  positionId: number,
  userId: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    TradeModel.deleteByPositionId(positionId, userId, (err, result) => {
      if (err) {
        return reject(err);
      }
      if (result && result.changes === 0) {
        return reject(new Error("Position not found or no trades in position"));
      }
      resolve();
    });
  });
}; 