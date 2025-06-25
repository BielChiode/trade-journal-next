import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import pool from "@/lib/db/database";
import { PositionModel } from "@/models/position";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);
    const { quantity, price, date } = await request.json();

    if (!quantity || !price || !date || quantity <= 0 || price <= 0) {
      return NextResponse.json({ message: "Invalid increment data" }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Buscar e bloquear a posição para a atualização
    const positionResult = await client.query('SELECT * FROM positions WHERE id = $1 AND user_id = $2 FOR UPDATE', [positionId, userId]);
    const position = positionResult.rows[0];

    if (!position) {
      throw new Error("Position not found");
    }

    if (position.status === 'Closed') {
        return NextResponse.json({ message: "Cannot increment a closed position" }, { status: 400 });
    }

    // 2. Calcular novo preço médio e quantidade
    const existingValue = position.average_entry_price * position.current_quantity;
    const incrementValue = price * quantity;
    const newQuantity = position.current_quantity + quantity;
    const newAveragePrice = (existingValue + incrementValue) / newQuantity;

    // 3. Atualizar a posição
    const updatePositionQuery = `
        UPDATE positions
        SET average_entry_price = $1, current_quantity = $2
        WHERE id = $3
    `;
    await client.query(updatePositionQuery, [newAveragePrice, newQuantity, positionId]);

    // 4. Criar a operação de incremento
    const createOperationQuery = `
        INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date)
        VALUES ($1, $2, 'Increment', $3, $4, $5)
    `;
    await client.query(createOperationQuery, [positionId, userId, quantity, price, date]);
    
    await client.query('COMMIT');

    return NextResponse.json({ message: "Position incremented successfully" });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to increment position:", error);
    return NextResponse.json(
      { message: error.message || "Failed to increment position" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
