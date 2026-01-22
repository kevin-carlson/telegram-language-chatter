import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from './config';
import {
  handleHelpCommand,
  handlePinyinCommand,
  handleTranslateCommand,
  handlePronounceCommand,
  handleWordCommand,
  handleLevelCommand,
  handleInstantCommand,
  handleStatusCommand,
  setWordCommandContext,
} from './commands';
import {
  handleTextMessage,
  handleVoiceMessage,
  handleReply,
  setMessageHandlerContext,
  setVoiceHandlerContext,
} from './handlers';
import { loadReferenceMaterials, watchMaterialsDirectory } from './services/materials';
import { startDailyWordScheduler, stopDailyWordScheduler } from './services/scheduler';
import { initializeDatabase, closeDatabase } from './database';
import { clearAllPendingResponses } from './services/delay';
import { clearAllContexts } from './services/context';

let referenceMaterials: string = '';

export async function createBot(): Promise<Telegraf> {
  // Initialize database if enabled
  if (config.database.enabled) {
    await initializeDatabase();
  }

  // Load reference materials
  console.log('Loading reference materials...');
  referenceMaterials = await loadReferenceMaterials();

  // Watch for material changes
  watchMaterialsDirectory(async () => {
    console.log('Reloading reference materials...');
    referenceMaterials = await loadReferenceMaterials();
  });

  // Create bot
  const bot = new Telegraf(config.telegram.botToken);

  // Set handler contexts
  setMessageHandlerContext({ bot, referenceMaterials });
  setVoiceHandlerContext({ bot, referenceMaterials });
  setWordCommandContext(bot, referenceMaterials);

  // Register commands
  bot.command('start', async (ctx) => {
    await ctx.reply(
      `👋 Welcome to the Language Learning Bot!

I'm here to help you practice ${config.language.target}. Let's start a conversation!

Use /help to see all available commands.

Ready to practice? Just send me a message in ${config.language.target} or ${config.language.native}!`
    );
  });

  bot.command('help', handleHelpCommand);
  bot.command('pinyin', handlePinyinCommand);
  bot.command('translate', handleTranslateCommand);
  bot.command('pronounce', handlePronounceCommand);
  bot.command('word', handleWordCommand);
  bot.command('level', handleLevelCommand);
  bot.command('instant', handleInstantCommand);
  bot.command('status', handleStatusCommand);

  // Handle voice messages
  bot.on(message('voice'), handleVoiceMessage);

  // Handle text messages (including replies)
  bot.on(message('text'), async (ctx) => {
    // Skip if it's a command
    if (ctx.message.text.startsWith('/')) return;

    // Check if it's a reply to a bot message with special keywords
    const handled = await handleReply(ctx);
    if (handled) return;

    // Handle as regular message
    await handleTextMessage(ctx);
  });

  // Error handling
  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('An error occurred. Please try again.').catch(console.error);
  });

  // Start daily word scheduler
  startDailyWordScheduler({ bot, referenceMaterials });

  return bot;
}

export async function startBot(bot: Telegraf): Promise<void> {
  // Enable graceful stop
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down...`);

    // Stop the scheduler
    stopDailyWordScheduler();

    // Clear pending responses
    clearAllPendingResponses();

    // Clear contexts
    clearAllContexts();

    // Close database
    await closeDatabase();

    // Stop the bot
    bot.stop(signal);

    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  // Start the bot
  console.log('Starting bot...');

  if (process.env.WEBHOOK_URL) {
    // Use webhook for production (Railways, etc.)
    const webhookUrl = process.env.WEBHOOK_URL;
    const port = parseInt(process.env.PORT || '3000', 10);

    await bot.launch({
      webhook: {
        domain: webhookUrl,
        port,
      },
    });

    console.log(`Bot started with webhook on port ${port}`);
  } else {
    // Use polling for development
    await bot.launch();
    console.log('Bot started with polling');
  }

  console.log(`AI Provider: ${config.ai.provider}`);
  console.log(`Target Language: ${config.language.target}`);
  console.log(`Learning Level: ${config.language.level}`);
  console.log(`Database: ${config.database.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`Response Delay: ${config.responseDelay.min}-${config.responseDelay.max} seconds`);
}
