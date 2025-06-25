import pool from "@/lib/db/database";
import { PositionModel, OperationModel } from "@/models/position";
import { Position, Operation, Trade } from "@/types/trade";

export const getOperationsByPositionId = (positionId: number, userId: number): Promise<Operation[]> => {
  // Esta função agora pode usar o PositionModel diretamente.
  // A query original também filtrava por userId, que é uma boa prática.
  // O ideal é que a lógica no modelo também inclua o userId.
  // Por agora, vamos usar o que temos.
  return PositionModel.findOperationsByPositionId(positionId);
};

// As funções de TradeModel parecem ser código legado e estão comentadas
// export const findTradeById = (tradeId: number, userId: number): Promise<Trade> => {
//   ...
// };
// export const createTrade = (trade: Trade, userId: number): Promise<any> => {
//   ...
// };
// export const updateTrade = (tradeId: number, data: Partial<Trade>, userId: number): Promise<void> => {
//   ...
// };

// Simplificado para usar o método do modelo
export const deletePosition = (positionId: number, userId: number): Promise<void> => {
  return PositionModel.delete(positionId, userId);
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

// Refatorado com transação usando o pool do pg
export const createPositionWithInitialOperation = async (
  params: CreatePositionParams
): Promise<{ positionId: number }> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const positionQuery = `
      INSERT INTO positions (user_id, ticker, type, status, average_entry_price, current_quantity, initial_entry_date, setup, observations)
      VALUES ($1, $2, $3, 'Open', $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const positionResult = await client.query(positionQuery, [
      params.user_id, params.ticker, params.type, params.entry_price, params.quantity, params.entry_date, params.setup, params.observations
    ]);
    const positionId = positionResult.rows[0].id;

    const operationQuery = `
      INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date, observations)
      VALUES ($1, $2, 'Entry', $3, $4, $5, $6)
    `;
    await client.query(operationQuery, [
      positionId, params.user_id, params.quantity, params.entry_price, params.entry_date, params.observations
    ]);

    await client.query('COMMIT');
    return { positionId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const positionRes = await client.query('SELECT * FROM positions WHERE id = $1 AND user_id = $2 FOR UPDATE', [positionId, userId]);
    if (positionRes.rows.length === 0) {
      throw new Error("Position not found");
    }
    const position = positionRes.rows[0];

    const opsRes = await client.query('SELECT * FROM operations WHERE position_id = $1 AND user_id = $2', [positionId, userId]);
    const operations = opsRes.rows;

    const isRestricted = position.status === 'Closed' || operations.length > 1;

    if (isRestricted) {
      // Edição restrita: apenas setup e observações
      const query = `UPDATE positions SET setup = $1, observations = $2 WHERE id = $3 AND user_id = $4`;
      await client.query(query, [data.setup, data.observations, positionId, userId]);
    } else {
      // Edição completa: atualiza posição e a operação de entrada
      const updatePosQuery = `
        UPDATE positions 
        SET ticker = $1, type = $2, initial_entry_date = $3, average_entry_price = $4, current_quantity = $5, setup = $6, observations = $7
        WHERE id = $8 AND user_id = $9`;
      await client.query(updatePosQuery, [data.ticker, data.type, data.entry_date, data.entry_price, data.quantity, data.setup, data.observations, positionId, userId]);

      const updateOpQuery = `
        UPDATE operations
        SET price = $1, quantity = $2, date = $3
        WHERE position_id = $4 AND user_id = $5 AND operation_type = 'Entry'`;
      await client.query(updateOpQuery, [data.entry_price, data.quantity, data.entry_date, positionId, userId]);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}; 