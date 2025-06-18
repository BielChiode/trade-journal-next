import db from '../db/database';
import { Trade } from '../types/trade';

type TradeCallback = (err: Error | null, result: { id: number } | { changes: number } | Trade[]) => void;

const TradeModel = {
    create: (trade: Trade, callback: (err: Error | null, result: { id: number }) => void) => {
        const sql = `INSERT INTO trades (ticker, type, entry_date, entry_price, exit_date, exit_price, quantity, setup, observations, result, position_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [trade.ticker, trade.type, trade.entry_date, trade.entry_price, trade.exit_date, trade.exit_price, trade.quantity, trade.setup, trade.observations, trade.result, trade.position_id], function(this: import('sqlite3').RunResult, err: Error | null) {
            if (err) {
                return callback(err, { id: -1 });
            }
            const newId = this.lastID;
            // If it's a new trade (without position_id), update it to point to itself.
            if (!trade.position_id) {
                db.run('UPDATE trades SET position_id = ? WHERE id = ?', [newId, newId], (updateErr: Error | null) => {
                    callback(updateErr, { id: newId });
                });
            } else {
                callback(null, { id: newId });
            }
        });
    },
    findAll: (callback: (err: Error | null, trades: Trade[]) => void) => {
        const sql = `SELECT * FROM trades ORDER BY entry_date DESC`;
        db.all(sql, [], (err: Error | null, rows: Trade[]) => {
            callback(err, rows);
        });
    },
    find: (id: number, callback: (err: Error | null, trade: Trade | null) => void) => {
        const sql = `SELECT * FROM trades WHERE id = ?`;
        db.get(sql, [id], (err: Error | null, row: Trade) => {
            callback(err, row);
        });
    },
    update: (id: number, trade: Trade, callback: (err: Error | null, result: { changes: number }) => void) => {
        const sql = `UPDATE trades SET ticker = ?, type = ?, entry_date = ?, entry_price = ?, exit_date = ?, exit_price = ?, quantity = ?, setup = ?, observations = ?, result = ? WHERE id = ?`;
        db.run(sql, [trade.ticker, trade.type, trade.entry_date, trade.entry_price, trade.exit_date, trade.exit_price, trade.quantity, trade.setup, trade.observations, trade.result, id], function(this: import('sqlite3').RunResult, err: Error | null) {
            callback(err, { changes: this ? this.changes : 0 });
        });
    },
    findByPositionId: (positionId: number, callback: (err: Error | null, trades: Trade[]) => void) => {
        const sql = `SELECT * FROM trades WHERE position_id = ? ORDER BY exit_date ASC`;
        db.all(sql, [positionId], (err: Error | null, rows: Trade[]) => {
            callback(err, rows);
        });
    },
    delete: (id: number, callback: (err: Error | null, result: { changes: number }) => void) => {
        const sql = `DELETE FROM trades WHERE id = ?`;
        db.run(sql, id, function(this: import('sqlite3').RunResult, err: Error | null) {
            callback(err, { changes: this ? this.changes : 0 });
        });
    }
};

export default TradeModel; 