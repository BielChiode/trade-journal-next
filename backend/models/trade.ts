import db from '../db/database';
import { Trade } from '../types/trade';

type TradeCallback = (err: Error | null, result: { id: number } | { changes: number } | Trade[]) => void;

const TradeModel = {
    create: (trade: Trade, callback: (err: Error | null, result: { id: number }) => void) => {
        const sql = `INSERT INTO trades (ticker, tipo, data_entrada, preco_entrada, data_saida, preco_saida, quantidade, setup, observacoes, resultado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [trade.ticker, trade.tipo, trade.data_entrada, trade.preco_entrada, trade.data_saida, trade.preco_saida, trade.quantidade, trade.setup, trade.observacoes, trade.resultado], function(this: import('sqlite3').RunResult, err: Error | null) {
            callback(err, { id: this ? this.lastID : -1 });
        });
    },
    findAll: (callback: (err: Error | null, trades: Trade[]) => void) => {
        const sql = `SELECT * FROM trades ORDER BY data_entrada DESC`;
        db.all(sql, [], (err: Error | null, rows: Trade[]) => {
            callback(err, rows);
        });
    },
    update: (id: number, trade: Trade, callback: (err: Error | null, result: { changes: number }) => void) => {
        const sql = `UPDATE trades SET ticker = ?, tipo = ?, data_entrada = ?, preco_entrada = ?, data_saida = ?, preco_saida = ?, quantidade = ?, setup = ?, observacoes = ?, resultado = ? WHERE id = ?`;
        db.run(sql, [trade.ticker, trade.tipo, trade.data_entrada, trade.preco_entrada, trade.data_saida, trade.preco_saida, trade.quantidade, trade.setup, trade.observacoes, trade.resultado, id], function(this: import('sqlite3').RunResult, err: Error | null) {
            callback(err, { changes: this ? this.changes : 0 });
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