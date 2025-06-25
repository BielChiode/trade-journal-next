import pg from 'pg';

// O PostgreSQL retorna o tipo NUMERIC(1700) como string para evitar perda de precisão.
// Para nossa aplicação, podemos seguramente convertê-lo para um float.
// Esta configuração é global para a instância do pg.
pg.types.setTypeParser(1700, (val) => parseFloat(val));

const { Pool } = pg;

// A configuração do pool será feita uma única vez.
// Em produção, a Vercel injeta a connection string com SSL.
// Localmente, nosso .env.local aponta para o Docker sem SSL.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Função para criar as tabelas se não existirem, agora usando o pool do pg.
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        token_version INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ticker VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK(type IN ('Buy', 'Sell')),
        status VARCHAR(50) NOT NULL CHECK(status IN ('Open', 'Closed')),
        average_entry_price NUMERIC NOT NULL,
        current_quantity INTEGER NOT NULL,
        total_realized_pnl NUMERIC NOT NULL DEFAULT 0,
        initial_entry_date TIMESTAMP NOT NULL,
        last_exit_date TIMESTAMP,
        setup TEXT,
        observations TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS operations (
        id SERIAL PRIMARY KEY,
        position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        operation_type VARCHAR(50) NOT NULL CHECK(operation_type IN ('Entry', 'Increment', 'PartialExit')),
        quantity INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        date TIMESTAMP NOT NULL,
        result NUMERIC,
        observations TEXT
      );
    `);
    console.log('Tables created successfully or already exist.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Exportamos apenas o pool. Ele será nosso único ponto de contato com o DB.
export default pool; 