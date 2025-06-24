import prisma from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
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

    const positionId = parseInt(params.id, 10);
    const { exitQuantity, exitPrice, exitDate } = await request.json();

    if (!exitQuantity || !exitPrice || !exitDate || exitQuantity <= 0) {
      return NextResponse.json(
        { message: "Exit quantity, price, and date are required." },
        { status: 400 }
      );
    }

    // The 'id' is the positionId, which is the id of the master trade
    const masterTrade = await prisma.trade.findUnique({
        where: { id: positionId, userId: userId }
    });
    
    if (!masterTrade) {
        return NextResponse.json({ message: "Position master trade not found." }, { status: 404 });
    }
    
    if (exitQuantity > masterTrade.quantity) {
        return NextResponse.json({ message: "Exit quantity cannot be greater than the open quantity." }, { status: 400 });
    }
    
    // Calculate the result based on the master trade's average price
    const result =
      masterTrade.type === "Buy"
        ? (exitPrice - masterTrade.entryPrice) * exitQuantity
        : (masterTrade.entryPrice - exitPrice) * exitQuantity;
    
    const newQuantity = masterTrade.quantity - exitQuantity;

    // Update the master trade with the remaining quantity
    await prisma.trade.update({
        where: { id: positionId, userId: userId },
        data: { 
            quantity: newQuantity,
            // If the position is fully closed, mark the exit date on the master trade
            exitDate: newQuantity === 0 ? new Date(exitDate) : null,
            exitPrice: newQuantity === 0 ? exitPrice : null
        }
    });

    // Create a log entry for the partial exit
    await prisma.trade.create({
      data: {
        positionId: positionId,
        ticker: masterTrade.ticker,
        type: masterTrade.type,
        entryDate: masterTrade.entryDate, // Keep original entry date for reference
        entryPrice: masterTrade.entryPrice, // Keep original average price for reference
        exitDate: new Date(exitDate),
        exitPrice: exitPrice,
        quantity: exitQuantity,
        result: result,
        observations: `Partial exit from position #${positionId}`,
        userId: userId,
      },
    });

    return NextResponse.json({
        message: "Partial exit executed successfully.",
    });

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
