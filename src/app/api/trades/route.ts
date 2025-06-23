import { NextRequest, NextResponse } from "next/server";
import TradeModel from "@/models/trade";
import { Trade } from "@/types/trade";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return new Promise((resolve) => {
    TradeModel.findAllByUser(userId, (err: Error | null, trades: Trade[]) => {
      if (err) {
        resolve(
          NextResponse.json(
            { error: err.message },
            { status: 500 }
          )
        );
      } else {
        resolve(NextResponse.json(trades));
      }
    });
  });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const newTrade: Trade = await request.json();

  return new Promise((resolve) => {
    TradeModel.create(newTrade, userId, (err: Error | null, result: any) => {
      if (err) {
        resolve(
          NextResponse.json(
            { error: err.message },
            { status: 500 }
          )
        );
      } else {
        resolve(NextResponse.json(result, { status: 201 }));
      }
    });
  });
} 