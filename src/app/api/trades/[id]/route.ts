import { NextRequest, NextResponse } from "next/server";
import {
  findTradeById,
  updateTrade,
  deletePosition,
} from "@/lib/db/trade-helpers";

// Mock user ID - you'll replace this with actual auth logic
const FAKE_USER_ID = 1;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await (params as any);
    const tradeId = parseInt(id, 10);
    const trade = await findTradeById(tradeId);
    return NextResponse.json(trade);
  } catch (error: any) {
    const status = error.message === "Trade not found" ? 404 : 500;
    return NextResponse.json({ message: error.message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await (params as any);
    const tradeId = parseInt(id, 10);
    const tradeData = await request.json();
    await updateTrade(tradeId, tradeData);
    return NextResponse.json({ message: "Trade updated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update trade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await (params as any);
    const positionId = parseInt(id, 10);
    await deletePosition(positionId);
    return NextResponse.json({ message: "Position deleted successfully" });
  } catch (error: any) {
    const status =
      error.message === "Position not found or no trades in position"
        ? 404
        : 500;
    return NextResponse.json(
      { message: error.message || "Failed to delete position" },
      { status }
    );
  }
}
