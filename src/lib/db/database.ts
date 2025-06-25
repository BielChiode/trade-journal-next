import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'trades.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Tabela de Usuários
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )`);

            // Tabela de Posições
            db.run(`CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                ticker TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('Buy', 'Sell')),
                status TEXT NOT NULL CHECK(status IN ('Open', 'Closed')),
                average_entry_price REAL NOT NULL,
                current_quantity INTEGER NOT NULL,
                total_realized_pnl REAL NOT NULL DEFAULT 0,
                initial_entry_date TEXT NOT NULL,
                last_exit_date TEXT,
                setup TEXT,
                observations TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Tabela de Operações (log de eventos)
            db.run(`CREATE TABLE IF NOT EXISTS operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                position_id INTEGER,
                user_id INTEGER,
                operation_type TEXT NOT NULL CHECK(operation_type IN ('Entry', 'Increment', 'PartialExit')),
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                date TEXT NOT NULL,
                result REAL,
                observations TEXT,
                FOREIGN KEY (position_id) REFERENCES positions (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);
        });
    }
});

export default db; 