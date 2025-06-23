import { NextResponse } from "next/server";
import TradeModel from "@/models/trade";
import { Trade } from "@/types/trade";

// Mock user ID - you'll replace this with actual auth logic
const FAKE_USER_ID = 1;

export async function GET() {
  return new Promise((resolve) => {
    TradeModel.findAllByUser(FAKE_USER_ID, (err: Error | null, trades: Trade[]) => {
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

export async function POST(request: Request) {
  const newTrade: Trade = await request.json();

  return new Promise((resolve) => {
    TradeModel.create(newTrade, FAKE_USER_ID, (err: Error | null, result: any) => {
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