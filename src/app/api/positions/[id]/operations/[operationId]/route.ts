import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserIdFromRequest } from "@/lib/auth";

interface RouteContext {
  params: Promise<{
    id: string;
    operationId: string;
  }>;
}

async function recalculatePosition(positionId: number, tx: any) {
  const operations = await tx.operation.findMany({
    where: { positionId },
    orderBy: { date: "asc" },
  });

  if (operations.length === 0) {
    await tx.position.delete({ where: { id: positionId } });
    return null;
  }

  let totalValue = 0;
  let totalEntryQuantity = 0;
  let currentQuantity = 0;
  let totalRealizedPnl = 0;

  for (const op of operations) {
    const price = op.price.toNumber();
    const quantity = op.quantity.toNumber();

    if (op.operation_type === "Entry" || op.operation_type === "Increment") {
      totalValue += price * quantity;
      totalEntryQuantity += quantity;
      currentQuantity += quantity;
    } else if (op.operation_type === "PartialExit") {
      const avgEntryPrice =
        totalEntryQuantity > 0 ? totalValue / totalEntryQuantity : 0;
      const pnl = (price - avgEntryPrice) * quantity;
      totalRealizedPnl += pnl;
      currentQuantity -= quantity;

      if (op.result?.toNumber() !== pnl) {
        await tx.operation.update({
          where: { id: op.id },
          data: { result: pnl },
        });
      }
    }
  }

  const average_entry_price =
    totalEntryQuantity > 0 ? totalValue / totalEntryQuantity : 0;
  const initial_entry_date = operations[0].date;

  return tx.position.update({
    where: { id: positionId },
    data: {
      average_entry_price,
      current_quantity: currentQuantity,
      total_realized_pnl: totalRealizedPnl,
      initial_entry_date,
    },
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const params = await context.params;

  const positionId = parseInt(params.id, 10);
  const operationId = parseInt(params.operationId, 10);

  if (isNaN(positionId) || isNaN(operationId)) {
    return NextResponse.json(
      { error: "ID da posição ou operação inválido." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const position = await tx.position.findFirst({
        where: { id: positionId, userId },
      });

      if (!position) throw new Error("Posição não encontrada.");
      if (position.status !== "Open")
        throw new Error("Apenas posições abertas podem ser alteradas.");

      const operation = await tx.operation.findUnique({
        where: { id: operationId },
      });

      if (
        !operation ||
        operation.positionId !== positionId ||
        operation.operation_type === "Entry"
      ) {
        throw new Error("Operação inválida para exclusão.");
      }

      await tx.operation.delete({ where: { id: operationId } });
      await recalculatePosition(positionId, tx);
    });

    revalidatePath("/dashboard");

    return NextResponse.json({
      message: "Operação removida e posição recalculada.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
