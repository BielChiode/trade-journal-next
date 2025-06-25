import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import db from "@/lib/db/database";
import { Position } from "@/types/trade";

const findPositionById = (positionId: number, userId: number): Promise<Position> => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM positions WHERE id = ? AND user_id = ?", [positionId, userId], (err, row: Position) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("Position not found"));
      resolve(row);
    });
  });
};

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
    const { quantity, price, date } = await request.json();

    if (!quantity || !price || !date || quantity <= 0 || price <= 0) {
      return NextResponse.json({ message: "Invalid partial exit data" }, { status: 400 });
    }

    const position = await findPositionById(positionId, userId);

    if (quantity > position.current_quantity) {
        return NextResponse.json({ message: "Exit quantity cannot be greater than current quantity" }, { status: 400 });
    }

    // --- Início da Transação ---
    await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION", (err) => { if (err) return reject(err); });

            // 1. Calcular o resultado da operação
            const result = (price - position.average_entry_price) * quantity;
            
            // 2. Calcular novos valores para a posição
            const newQuantity = position.current_quantity - quantity;
            const newTotalRealizedPnl = position.total_realized_pnl + result;
            const newStatus = newQuantity === 0 ? 'Closed' : 'Open';

            // 3. Atualizar a posição
            const updatePositionQuery = `
                UPDATE positions
                SET current_quantity = ?, total_realized_pnl = ?, status = ?, last_exit_date = ?
                WHERE id = ?
            `;
            db.run(updatePositionQuery, [newQuantity, newTotalRealizedPnl, newStatus, date, positionId], function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                }

                // 4. Criar a operação de saída parcial
                const createOperationQuery = `
                    INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date, result)
                    VALUES (?, ?, 'PartialExit', ?, ?, ?, ?)
                `;
                db.run(createOperationQuery, [positionId, userId, quantity, price, date, result], function(err) {
                    if (err) {
                        db.run("ROLLBACK");
                        return reject(err);
                    }
                    
                    db.run("COMMIT", (err) => {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }
                        resolve();
                    });
                });
            });
        });
    });
    // --- Fim da Transação ---

    return NextResponse.json({ message: "Partial exit executed successfully" });

  } catch (error: any) {
    console.error("Failed to execute partial exit:", error);
    return NextResponse.json(
      { message: error.message || "Failed to execute partial exit" },
      { status: 500 }
    );
  }
}
