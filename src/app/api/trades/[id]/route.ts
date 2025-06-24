import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const tradeId = parseInt(id, 10);

    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(trade);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const tradeId = parseInt(id, 10);
    const tradeData = await request.json();

    // Garante que o usuário só pode atualizar seus próprios trades
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    const {
      ticker,
      type,
      entry_date,
      entry_price,
      quantity,
      setup,
      observations,
    } = tradeData;

    await prisma.trade.update({
      where: { id: tradeId },
      data: {
        ticker,
        type,
        entryDate: new Date(entry_date),
        entryPrice: entry_price,
        quantity,
        setup,
        observations,
      },
    });

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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const positionId = parseInt(id, 10);

    // Garante que o usuário só pode deletar suas próprias posições
    const tradesInPosition = await prisma.trade.findMany({
      where: { positionId, userId },
    });

    if (tradesInPosition.length === 0) {
      return NextResponse.json(
        { message: "Position not found or no trades in position" },
        { status: 404 }
      );
    }

    await prisma.trade.deleteMany({
      where: {
        positionId: positionId,
        userId: userId,
      },
    });

    return NextResponse.json({ message: "Position deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to delete position" },
      { status: 500 }
    );
  }
}
