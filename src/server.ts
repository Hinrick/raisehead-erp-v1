import { app } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import cron from 'node-cron';
import { pollNotionChanges } from './modules/integration/providers/notion/notion.poller.js';
import { setupGoogleWatch } from './modules/integration/providers/google/google.webhook.js';
import { setupOutlookSubscription } from './modules/integration/providers/outlook/outlook.webhook.js';

async function main() {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });

  // ── Cron Jobs ──────────────────────────────────
  // Notion polling: every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await pollNotionChanges();
    } catch (error) {
      console.error('Notion poll cron error:', error);
    }
  });

  // Google watch renewal: every 6 days
  cron.schedule('0 0 */6 * *', async () => {
    try {
      await setupGoogleWatch();
    } catch (error) {
      console.error('Google watch renewal error:', error);
    }
  });

  // Outlook subscription renewal: every 2 days
  cron.schedule('0 0 */2 * *', async () => {
    try {
      await setupOutlookSubscription();
    } catch (error) {
      console.error('Outlook subscription renewal error:', error);
    }
  });

  // Initial setup of webhook subscriptions
  setTimeout(async () => {
    try {
      await setupGoogleWatch();
      await setupOutlookSubscription();
    } catch (error) {
      console.error('Initial webhook setup error:', error);
    }
  }, 5000);

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
