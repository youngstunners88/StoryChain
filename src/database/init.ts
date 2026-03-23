import { initializeDatabase } from './connection.js';

async function main() {
  await initializeDatabase();
  console.log('[Database] Initialization completed');
}

main().catch((error) => {
  console.error('[Database] Initialization failed:', error);
  process.exit(1);
});
