import { NextRequest, NextResponse } from "next/server";
import TradeModel from "@/models/trade";
import { getUserIdFromRequest } from "@/lib/auth";

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
    const { increment_quantity, increment_price, increment_date } =
      await request.json();

    if (
      !increment_quantity ||
      !increment_price ||
      !increment_date ||
      increment_quantity <= 0 ||
      increment_price <= 0
    ) {
      return NextResponse.json(
        { message: "Invalid increment data" },
        { status: 400 }
      );
    }

    // First, get the existing trade
    const existingTrade = await new Promise<any>((resolve, reject) => {
      const query = "SELECT * FROM trades WHERE id = ?";
      require("@/lib/db/database").default.get(
        query,
        [tradeId],
        (err: Error, row: any) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });

    if (!existingTrade) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    // Calculate new average price and quantity
    const existing_total_value =
      existingTrade.entry_price * existingTrade.quantity;
    const increment_value = increment_price * increment_quantity;

    const new_quantity = existingTrade.quantity + increment_quantity;
    const new_entry_price =
      (existing_total_value + increment_value) / new_quantity;

    // Update the trade in the database
    const updatedTradeData = {
      quantity: new_quantity,
      entry_price: new_entry_price,
    };

    await new Promise<void>((resolve, reject) => {
      TradeModel.update(tradeId, updatedTradeData, userId, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Create a log entry for the increment
    const incrementLogTrade = {
      ticker: existingTrade.ticker,
      type: existingTrade.type,
      entry_date: increment_date, // Or use the current date
      entry_price: increment_price,
      quantity: increment_quantity,
      position_id: existingTrade.position_id,
      observations: `Increment to trade #${tradeId}`,
      status: "Open", // The log itself doesn't close
    };
    await new Promise<void>((resolve, reject) => {
      TradeModel.create(incrementLogTrade, userId, (err: any) => {
        if (err) return reject(err);
        resolve();
      });
    });

    return NextResponse.json({
      message: "Position incremented successfully",
    });
  } catch (error) {
    console.error("Failed to increment position:", error);
    return NextResponse.json(
      { message: "Failed to increment position" },
      { status: 500 }
    );
  }
} 