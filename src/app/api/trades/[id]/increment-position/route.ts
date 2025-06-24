import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
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

    const { incrementQuantity, incrementPrice, incrementDate } = await request.json();

    if (
      !incrementQuantity ||
      !incrementPrice ||
      !incrementDate ||
      incrementQuantity <= 0 ||
      incrementPrice <= 0
    ) {
      return NextResponse.json(
        { message: "Invalid increment data" },
        { status: 400 }
      );
    }

    const positionId = parseInt(params.id, 10);

    // The 'id' in this context is the ID of the master trade record for the position
    const masterTrade = await prisma.trade.findUnique({
      where: { id: positionId, userId: userId },
    });

    if (!masterTrade) {
      return NextResponse.json(
        { message: "Position master trade not found" },
        { status: 404 }
      );
    }

    // Calculate new average price and quantity
    const existingTotalValue = masterTrade.entryPrice * masterTrade.quantity;
    const incrementValue = incrementPrice * incrementQuantity;

    const newQuantity = masterTrade.quantity + incrementQuantity;
    const newAveragePrice = (existingTotalValue + incrementValue) / newQuantity;

    // Update the master trade with the new state
    await prisma.trade.update({
      where: { id: positionId, userId: userId },
      data: {
        quantity: newQuantity,
        entryPrice: newAveragePrice,
      },
    });

    // Create a log entry for the increment (this is not used for calculations)
    // We mark it with a non-null result to distinguish it from the master trade.
    await prisma.trade.create({
      data: {
        positionId: positionId,
        ticker: masterTrade.ticker,
        type: masterTrade.type,
        entryDate: new Date(incrementDate),
        entryPrice: incrementPrice,
        quantity: incrementQuantity,
        observations: `Increment to position #${positionId}`,
        userId,
        result: 0, 
      },
    });

    return NextResponse.json({
      message: "Position incremented successfully",
    });

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 