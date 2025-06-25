import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import pool from "@/lib/db/database";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const client = await pool.connect();
  try {
    const params = await context.params;
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

    await client.query("BEGIN");

    // 1. Buscar e bloquear a posição para a atualização
    const positionResult = await client.query(
      "SELECT * FROM positions WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [positionId, userId]
    );
    const position = positionResult.rows[0];

    if (!position) {
      throw new Error("Position not found");
    }

    if (quantity > position.current_quantity) {
      await client.query("ROLLBACK"); // Libera o lock
      return NextResponse.json(
        { message: "Exit quantity cannot be greater than current quantity" },
        { status: 400 }
      );
    }

    // 2. Calcular o resultado da operação
    let result: number;
    if (position.type === "Buy") {
      result = (price - position.average_entry_price) * quantity;
    } else {
      // Para 'Sell'
      result = (position.average_entry_price - price) * quantity;
    }

    // 3. Calcular novos valores para a posição
    const newQuantity = position.current_quantity - quantity;
    const newTotalRealizedPnl = position.total_realized_pnl + result;
    const newStatus = newQuantity === 0 ? "Closed" : "Open";

    // 4. Atualizar a posição
    const updatePositionQuery = `
        UPDATE positions
        SET current_quantity = $1, total_realized_pnl = $2, status = $3, last_exit_date = $4
        WHERE id = $5
    `;
    await client.query(updatePositionQuery, [
      newQuantity,
      newTotalRealizedPnl,
      newStatus,
      date,
      positionId,
    ]);

    // 5. Criar a operação de saída parcial
    const createOperationQuery = `
        INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date, result)
        VALUES ($1, $2, 'PartialExit', $3, $4, $5, $6)
    `;
    await client.query(createOperationQuery, [
      positionId,
      userId,
      quantity,
      price,
      date,
      result,
    ]);

    await client.query("COMMIT");

    return NextResponse.json({ message: "Partial exit executed successfully" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    const paramsForError =
      "params" in context ? (await context.params).id : "unknown";
    console.error(
      `Failed to execute partial exit on position ${paramsForError}:`,
      error
    );
    return NextResponse.json(
      { message: error.message || "Failed to execute partial exit" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
