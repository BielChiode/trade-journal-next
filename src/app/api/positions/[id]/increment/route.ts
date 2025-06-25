import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import db from "@/lib/db/database";
import { Position, Operation } from "@/types/trade";

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
      return NextResponse.json({ message: "Invalid increment data" }, { status: 400 });
    }

    const position = await findPositionById(positionId, userId);

    if (position.status === 'Closed') {
        return NextResponse.json({ message: "Cannot increment a closed position" }, { status: 400 });
    }

    // --- Início da Transação ---
    await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION", (err) => { if (err) return reject(err); });

            // 1. Calcular novo preço médio e quantidade
            const existingValue = position.average_entry_price * position.current_quantity;
            const incrementValue = price * quantity;
            const newQuantity = position.current_quantity + quantity;
            const newAveragePrice = (existingValue + incrementValue) / newQuantity;

            // 2. Atualizar a posição
            const updatePositionQuery = `
                UPDATE positions
                SET average_entry_price = ?, current_quantity = ?
                WHERE id = ?
            `;
            db.run(updatePositionQuery, [newAveragePrice, newQuantity, positionId], function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                }

                // 3. Criar a operação de incremento
                const createOperationQuery = `
                    INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date)
                    VALUES (?, ?, 'Increment', ?, ?, ?)
                `;
                db.run(createOperationQuery, [positionId, userId, quantity, price, date], function(err) {
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

    return NextResponse.json({ message: "Position incremented successfully" });

  } catch (error: any) {
    console.error("Failed to increment position:", error);
    return NextResponse.json(
      { message: error.message || "Failed to increment position" },
      { status: 500 }
    );
  }
}
