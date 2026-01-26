import { app } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function main() {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    server.close(async () => {
      await disconnectDatabase();
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
