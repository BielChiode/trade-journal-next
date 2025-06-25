import db from "@/lib/db/database";
import { Position, Operation } from "@/types/trade";

export const PositionModel = {
  // Encontra todas as posições de um usuário
  findAllByUser: (
    userId: number,
    callback: (err: Error | null, positions: Position[]) => void
  ) => {
    const query = `
      SELECT
        p.*,
        CASE
          WHEN p.status = 'Closed' THEN (
            SELECT SUM(o.quantity)
            FROM operations o
            WHERE o.position_id = p.id AND o.operation_type IN ('Entry', 'Increment')
          )
          ELSE p.current_quantity
        END AS total_quantity,
        CASE
          WHEN p.status = 'Closed' THEN (
            SELECT AVG(o.price)
            FROM operations o
            WHERE o.position_id = p.id AND o.operation_type = 'PartialExit'
          )
          ELSE NULL
        END AS average_exit_price
      FROM positions p
      WHERE p.user_id = ?
    `;
    db.all(query, [userId], callback);
  },

  // Encontra uma posição pelo ID
  findById: (
    positionId: number,
    userId: number,
    callback: (err: Error | null, position: Position | null) => void
  ) => {
    const query = "SELECT * FROM positions WHERE id = ? AND user_id = ?";
    db.get(query, [positionId, userId], callback);
  },

  // Deleta uma posição e todas as suas operações associadas
  delete: (
    positionId: number,
    userId: number,
    callback: (err: Error | null) => void
  ) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION;", (err) => {
        if (err) return callback(err);

        const deleteOpsQuery = "DELETE FROM operations WHERE position_id = ? AND user_id = ?";
        db.run(deleteOpsQuery, [positionId, userId], (err) => {
          if (err) {
            db.run("ROLLBACK;");
            return callback(err);
          }

          const deletePosQuery = "DELETE FROM positions WHERE id = ? AND user_id = ?";
          db.run(deletePosQuery, [positionId, userId], (err) => {
      if (err) {
              db.run("ROLLBACK;");
        return callback(err);
      }
            db.run("COMMIT;", callback);
          });
        });
      });
    });
  },

  // Encontra todas as operações para uma determinada posição
  findOperationsByPositionId: (
    positionId: number,
    callback: (err: Error | null, operations: Operation[]) => void
  ) => {
    const query = "SELECT * FROM operations WHERE position_id = ? ORDER BY date ASC";
    db.all(query, [positionId], callback);
  },
};

export const OperationModel = {
    // Cria uma nova operação
    create: (
      operation: Omit<Operation, 'id'>,
      callback: (err: Error | null, result: { id: number } | null) => void
  ) => {
      const { position_id, user_id, operation_type, quantity, price, date, result: opResult, observations } = operation;
      const query = `
        INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date, result, observations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(query, [position_id, user_id, operation_type, quantity, price, date, opResult, observations], function(err) {
        if (err) return callback(err, null);
        callback(null, { id: this.lastID });
      });
    }
};
