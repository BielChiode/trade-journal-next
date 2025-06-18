import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '..', '..', 'trades.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            tipo TEXT NOT NULL,
            data_entrada TEXT NOT NULL,
            preco_entrada REAL NOT NULL,
            data_saida TEXT,
            preco_saida REAL,
            quantidade INTEGER NOT NULL,
            setup TEXT,
            observacoes TEXT,
            resultado REAL
        )`);
    }
});

export default db; 