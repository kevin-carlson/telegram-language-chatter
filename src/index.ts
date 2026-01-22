import { createBot, startBot } from './bot';

async function main(): Promise<void> {
  try {
    console.log('🌏 Language Learning Telegram Bot');
    console.log('================================');

    const bot = await createBot();
    await startBot(bot);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
