import pool from "@/lib/db/database";
import { Position, Operation } from "@/types/trade";

// Helper para garantir que a conexão do pool seja liberada
async function withClient<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export const PositionModel = {
  // Encontra todas as posições de um usuário
  async findAllByUser(userId: number): Promise<Position[]> {
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
      WHERE p.user_id = $1
      ORDER BY
        CASE
          WHEN p.status = 'Open' THEN 1
          ELSE 2
        END,
        p.last_exit_date DESC NULLS LAST
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows as Position[];
  },

  // Encontra uma posição pelo ID
  async findById(positionId: number, userId: number): Promise<Position | null> {
    const { rows } = await pool.query<Position>('SELECT * FROM positions WHERE id = $1 AND user_id = $2', [positionId, userId]);
    return rows[0] || null;
  },

  // Deleta uma posição e todas as suas operações associadas usando uma transação
  async delete(positionId: number, userId: number): Promise<void> {
    return withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM operations WHERE position_id = $1 AND user_id = $2', [positionId, userId]);
        await client.query('DELETE FROM positions WHERE id = $1 AND user_id = $2', [positionId, userId]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });
  },

  // Encontra todas as operações para uma determinada posição, validando o usuário
  async findOperationsByPositionId(positionId: number, userId: number): Promise<Operation[]> {
    const { rows } = await pool.query<Operation>('SELECT * FROM operations WHERE position_id = $1 AND user_id = $2 ORDER BY date ASC', [positionId, userId]);
    return rows;
  },
};

export const OperationModel = {
    // Cria uma nova operação e retorna o ID
    async create(operation: Omit<Operation, 'id'>): Promise<{ id: number }> {
      const { position_id, user_id, operation_type, quantity, price, date, result: opResult, observations } = operation;
      const query = `
        INSERT INTO operations (position_id, user_id, operation_type, quantity, price, date, result, observations)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const { rows } = await pool.query(query, [position_id, user_id, operation_type, quantity, price, date, opResult, observations]);
      return rows[0] as { id: number };
    }
};
