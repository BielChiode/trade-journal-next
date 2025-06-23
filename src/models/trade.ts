import db from "@/lib/db/database";
import { Trade } from "@/types/trade";

const TradeModel = {
  findAllByUser: (
    userId: number,
    callback: (err: Error | null, trades: Trade[]) => void
  ) => {
    const query = "SELECT * FROM trades WHERE user_id = ?";
    db.all(query, [userId], (err, rows: Trade[]) => {
      callback(err, rows);
    });
  },

  create: (
    trade: Trade,
    userId: number,
    callback: (err: Error | null, result: any) => void
  ) => {
    const {
      ticker,
      type,
      entry_date,
      entry_price,
      exit_date,
      exit_price,
      quantity,
      setup,
      observations,
      result,
      position_id,
    } = trade;
    const query = `
      INSERT INTO trades (user_id, ticker, type, entry_date, entry_price, exit_date, exit_price, quantity, setup, observations, result, position_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const self = this;
    db.run(
      query,
      [
        userId,
        ticker,
        type,
        entry_date,
        entry_price,
        exit_date,
        exit_price,
        quantity,
        setup,
        observations,
        result,
        position_id,
      ],
      function (err) {
        if (err) {
          return callback(err, null);
        }
        const lastID = this.lastID;
        if (position_id == null) {
          // If position_id is not provided, this is a new position.
          // Set its position_id to its own ID.
          db.run(
            "UPDATE trades SET position_id = ? WHERE id = ?",
            [lastID, lastID],
            (updateErr) => {
              callback(updateErr, { id: lastID });
            }
          );
        } else {
          callback(err, { id: lastID });
        }
      }
    );
  },

  update: (
    tradeId: number,
    trade: Partial<Trade>,
    callback: (err: Error | null) => void
  ) => {
    const fields = Object.keys(trade)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(trade);
    const query = `UPDATE trades SET ${fields} WHERE id = ?`;
    db.run(query, [...values, tradeId], function (err) {
      callback(err);
    });
  },

  delete: (
    tradeId: number,
    callback: (err: Error | null, result?: { changes: number }) => void
  ) => {
    const query = "DELETE FROM trades WHERE id = ?";
    db.run(query, [tradeId], function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, { changes: this.changes });
    });
  },

  deleteByPositionId: (
    positionId: number,
    callback: (err: Error | null, result?: { changes: number }) => void
  ) => {
    const query = "DELETE FROM trades WHERE position_id = ?";
    db.run(query, [positionId], function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, { changes: this.changes });
    });
  },

  findById: (tradeId: number, callback: (err: Error | null, trade: Trade | null) => void) => {
    const query = 'SELECT * FROM trades WHERE id = ?';
    db.get(query, [tradeId], (err, row: Trade) => {
      callback(err, row);
    });
  },
};

export default TradeModel;
