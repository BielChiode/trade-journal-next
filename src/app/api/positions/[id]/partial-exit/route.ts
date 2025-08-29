import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OperationType, PositionStatus } from "@/generated/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);
    const { quantity, price, date } = await request.json();

    if (!quantity || !price || !date || quantity <= 0 || price <= 0) {
      return NextResponse.json(
        { message: "Invalid partial exit data" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const position = await tx.position.findUnique({
        where: { id: positionId, userId },
      });

      if (!position) {
        throw new Error("Position not found");
      }
      if (quantity > position.current_quantity.toNumber()) {
        throw new Error("Exit quantity cannot be greater than current quantity");
      }

      const avgEntryPrice = position.average_entry_price.toNumber();
      let operationResult: number;
      if (position.type === "Buy") {
        operationResult = (price - avgEntryPrice) * quantity;
      } else { // 'Sell'
        operationResult = (avgEntryPrice - price) * quantity;
      }
      
      const newQuantity = position.current_quantity.toNumber() - quantity;
      const newTotalRealizedPnl = position.total_realized_pnl.toNumber() + operationResult;
      const newStatus = newQuantity === 0 ? PositionStatus.Closed : PositionStatus.Open;

      await tx.position.update({
        where: { id: positionId },
        data: {
          current_quantity: newQuantity,
          total_realized_pnl: newTotalRealizedPnl,
          status: newStatus,
          last_exit_date: new Date(date),
        },
      });

      await tx.operation.create({
        data: {
          positionId,
          userId,
          operation_type: OperationType.PartialExit,
          quantity,
          price,
          date: new Date(date),
          result: operationResult,
        },
      });

      return { message: "Partial exit executed successfully" };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(
      `Failed to execute partial exit on position ${params.id}:`,
      error
    );
    return NextResponse.json(
      { message: error.message || "Failed to execute partial exit" },
      { status: 400 } // Usar 400 para erros de lógica de negócio (e.g., quantidade insuficiente)
    );
  }
}
