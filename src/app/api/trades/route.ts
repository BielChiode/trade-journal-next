import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { createPositionWithInitialOperation } from "@/lib/db/position-helpers";
import { PositionModel } from "@/models/position";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positions = await PositionModel.findAllByUser(userId);

    return NextResponse.json(positions);

  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json(
      { message: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

    const body = await request.json();
    const { ticker, type, entry_date, entry_price, quantity, setup, observations } = body;

    if (!ticker || !type || !entry_date || !entry_price || !quantity) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const result = await createPositionWithInitialOperation({
      user_id: userId,
      ticker,
      type,
      entry_date,
      entry_price,
      quantity,
      setup,
      observations,
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("Failed to create position:", error);
    return NextResponse.json(
      { message: "Failed to create position" },
      { status: 500 }
    );
  }
} 