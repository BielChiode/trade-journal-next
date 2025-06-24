import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { entryDate: "desc" },
    });

    return NextResponse.json(trades);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
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
    const {
      ticker,
      type,
      entryDate,
      entryPrice,
      quantity,
      setup,
      observations,
    } = body;

    if (!ticker || !type || !entryDate || !entryPrice || !quantity) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Create a placeholder trade first
    const newTrade = await prisma.trade.create({
      data: {
        ticker,
        type,
        entryDate: new Date(entryDate),
        entryPrice,
        quantity,
        setup,
        observations,
        userId,
        positionId: -1, // Temporary placeholder
      },
    });

    // Now, update the trade to set its positionId to its own id
    const finalTrade = await prisma.trade.update({
      where: { id: newTrade.id },
      data: { positionId: newTrade.id },
    });

    return NextResponse.json(finalTrade, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
} 