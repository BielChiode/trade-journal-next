import TradeModel from "@/models/trade";
import { Trade } from "@/types/trade";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db/database";
import { getUserIdFromRequest } from "@/lib/auth";

// Helper to run DB operations as promises
const findTradeById = (tradeId: number, userId: number): Promise<Trade> => {
  return new Promise((resolve, reject) => {
    TradeModel.findById(tradeId, userId, (err, trade) => {
      if (err) return reject(err);
      if (!trade) return reject(new Error("Trade not found"));
      resolve(trade);
    });
  });
};

const createTrade = (trade: Trade, userId: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    TradeModel.create(trade, userId, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const updateTrade = (
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

const deleteTrade = (tradeId: number, userId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    TradeModel.delete(tradeId, userId, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Mock user ID - you'll replace this with actual auth logic
// const FAKE_USER_ID = 1;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const tradeId = parseInt(params.id, 10);
    const { exit_quantity, exit_price, exit_date } = await request.json();

    if (!exit_quantity || !exit_price || !exit_date || exit_quantity <= 0) {
      return NextResponse.json(
        { message: "Exit quantity, price, and date are required." },
        { status: 400 }
      );
    }

    const originalTrade = await findTradeById(tradeId, userId);

    if (exit_quantity > originalTrade.quantity) {
      return NextResponse.json(
        { message: "Exit quantity cannot be greater than the trade quantity." },
        { status: 400 }
      );
    }

    let result = 0;
    if (originalTrade.type === "Buy") {
      result = (exit_price - originalTrade.entry_price) * exit_quantity;
    } else {
      result = (originalTrade.entry_price - exit_price) * exit_quantity;
    }

    const partialTradeToCreate: Omit<Trade, "id"> = {
      ticker: originalTrade.ticker,
      type: originalTrade.type,
      entry_date: originalTrade.entry_date,
      entry_price: originalTrade.entry_price,
      quantity: exit_quantity,
      exit_price: exit_price,
      exit_date: exit_date,
      result: result,
      observations: `Partial exit from trade #${tradeId}. ${
        originalTrade.observations || ""
      }`.trim(),
      position_id: originalTrade.position_id,
      setup: originalTrade.setup,
    };

    await createTrade(partialTradeToCreate as Trade, userId);

    const new_quantity = originalTrade.quantity - exit_quantity;

    if (new_quantity > 0) {
      // Update the original trade with the remaining quantity
      await updateTrade(tradeId, { quantity: new_quantity }, userId);
      return NextResponse.json({
        message: "Partial exit executed successfully.",
      });
    } else {
      // If no quantity remains, delete the original trade
      await deleteTrade(tradeId, userId);
      return NextResponse.json({
        message: "Trade completely closed with partial exit.",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
