import { initializeDatabase } from '../src/lib/db/database';

async function main() {
  console.log('Initializing database...');
  try {
    await initializeDatabase();
    console.log('Database initialized successfully. Tables were created or already existed.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main(); 