import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OperationType } from "@/generated/prisma";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const positionId = parseInt(params.id, 10);
    const { quantity, price, date } = await request.json();

    if (!quantity || !price || !date || quantity <= 0 || price <= 0) {
      return NextResponse.json({ message: "Invalid increment data" }, { status: 400 });
    }

    const updatedPosition = await prisma.$transaction(async (tx) => {
      // 1. Buscar e bloquear a posição
      const position = await tx.position.findUnique({
        where: { id: positionId, userId },
      });

      if (!position) {
        throw new Error("Position not found");
      }
      
      // 2. Calcular novos valores
      const currentTotalValue = position.average_entry_price.toNumber() * position.current_quantity;
      const incrementValue = price * quantity;
      
      const newQuantity = position.current_quantity + quantity;
      const newAverageEntryPrice = (currentTotalValue + incrementValue) / newQuantity;

      // 3. Atualizar a posição
      const newPosition = await tx.position.update({
        where: { id: positionId },
        data: {
          average_entry_price: newAverageEntryPrice,
          current_quantity: newQuantity,
        },
      });

      // 4. Criar a operação de incremento
      await tx.operation.create({
        data: {
          positionId,
          userId,
          operation_type: OperationType.Increment,
          quantity,
          price,
          date: new Date(date),
        },
      });

      return newPosition;
    });

    return NextResponse.json(updatedPosition);

  } catch (error: any) {
    const paramsForError = 'params' in context ? (await context.params).id : 'unknown';
    console.error(`Failed to increment position ${paramsForError}:`, error);
    return NextResponse.json(
      { message: error.message || "Failed to increment position" },
      { status: 500 }
    );
  }
}
