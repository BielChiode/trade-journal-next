import db from "@/lib/db/database";
import { Position, Operation, Trade } from "@/types/trade";

export const getOperationsByPositionId = (positionId: number, userId: number): Promise<Operation[]> => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM operations WHERE position_id = ? AND user_id = ? ORDER BY date ASC';
    db.all(query, [positionId, userId], (err: Error | null, rows: Operation[]) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

export const findTradeById = (tradeId: number, userId: number): Promise<Trade> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore - TradeModel is not defined, likely old code
    TradeModel.findById(tradeId, userId, (err: Error | null, trade: Trade) => {
      if (err) return reject(err);
      if (!trade) return reject(new Error("Trade not found"));
      resolve(trade);
    });
  });
};

export const createTrade = (trade: Trade, userId: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore - TradeModel is not defined, likely old code
    TradeModel.create(trade, userId, (err: Error | null, result: any) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const updateTrade = (
  tradeId: number,
  data: Partial<Trade>,
  userId: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore - TradeModel is not defined, likely old code
    TradeModel.update(tradeId, data, userId, (err: Error | null) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

export const deletePosition = (
  positionId: number,
  userId: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (err: Error | null) => {
        if (err) return reject(err);
      });

      // Primeiro, exclua as operações associadas
      const deleteOpsQuery = 'DELETE FROM operations WHERE position_id = ? AND user_id = ?';
      db.run(deleteOpsQuery, [positionId, userId], (err: Error | null) => {
        if (err) {
          db.run("ROLLBACK");
          return reject(err);
        }

        // Depois, exclua a posição
        const deletePosQuery = 'DELETE FROM positions WHERE id = ? AND user_id = ?';
        db.run(deletePosQuery, [positionId, userId], function (err: Error | null) {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }
          if (this.changes === 0) {
            db.run("ROLLBACK");
            return reject(new Error("Position not found or user not authorized"));
          }

          db.run("COMMIT", (err: Error | null) => {
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
};

type CreatePositionParams = {
  user_id: number;
  ticker: string;
  type: 'Buy' | 'Sell';
  entry_date: string;
  entry_price: number;
  quantity: number;
  setup?: string;
  observations?: string;
};

export const createPositionWithInitialOperation = (
  params: CreatePositionParams
): Promise<{ positionId: number }> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (err: Error | null) => {
        if (err) return reject(err);
      });

      const positionQuery = `
        INSERT INTO positions (user_id, ticker, type, status, average_entry_price, current_quantity, initial_entry_date, setup, observations)
        VALUES (?, ?, ?, 'Open', ?, ?, ?, ?, ?)
      `;
      db.run(
        positionQuery,
        [params.user_id, params.ticker, params.type, params.entry_price, params.quantity, params.entry_date, params.setup, params.observations],
        function (err: Error | null) {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }
          
          const positionId = this.lastID;
          const operationQuery = `
            INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date, observations)
            VALUES (?, ?, 'Entry', ?, ?, ?, ?)
          `;
          db.run(
            operationQuery,
            [positionId, params.user_id, params.quantity, params.entry_price, params.entry_date, params.observations],
            (err: Error | null) => {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }
              
              db.run("COMMIT", (err: Error | null) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                resolve({ positionId });
              });
            }
          );
        }
      );
    });
  });
};

export const updatePositionDetails = async (
  positionId: number,
  userId: number,
  data: { 
    ticker: string; 
    type: 'Buy' | 'Sell'; 
    entry_date: string; 
    entry_price: number;
    quantity: number;
    setup?: string; 
    observations?: string; 
  }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM positions WHERE id = ? AND user_id = ?', [positionId, userId], (err: Error | null, position: Position | undefined) => {
      if (err) return reject(err);
      if (!position) return reject(new Error("Position not found"));

      db.all('SELECT * FROM operations WHERE position_id = ? AND user_id = ?', [positionId, userId], (err: Error | null, operations: Operation[]) => {
        if (err) return reject(err);

        const isRestricted = position.status === 'Closed' || operations.length > 1;

        db.serialize(() => {
          db.run("BEGIN TRANSACTION");

          if (isRestricted) {
            // Edição restrita: apenas setup e observações
            const query = `UPDATE positions SET setup = ?, observations = ? WHERE id = ? AND user_id = ?`;
            db.run(query, [data.setup, data.observations, positionId, userId], function (err: Error | null) {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }
              db.run("COMMIT", (err: Error | null) => err ? reject(err) : resolve());
            });
          } else {
            // Edição completa: atualiza posição e a operação de entrada
            const updatePosQuery = `
              UPDATE positions 
              SET ticker = ?, type = ?, initial_entry_date = ?, average_entry_price = ?, current_quantity = ?, setup = ?, observations = ?
              WHERE id = ? AND user_id = ?`;
            
            db.run(updatePosQuery, [data.ticker, data.type, data.entry_date, data.entry_price, data.quantity, data.setup, data.observations, positionId, userId], (err: Error | null) => {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }

              const updateOpQuery = `
                UPDATE operations
                SET price = ?, quantity = ?, date = ?
                WHERE position_id = ? AND user_id = ? AND operation_type = 'Entry'`;
              
              db.run(updateOpQuery, [data.entry_price, data.quantity, data.entry_date, positionId, userId], (err: Error | null) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                db.run("COMMIT", (err: Error | null) => err ? reject(err) : resolve());
              });
            });
          }
        });
      });
    });
  });
}; 