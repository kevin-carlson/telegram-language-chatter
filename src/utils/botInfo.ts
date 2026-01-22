import { Telegraf } from 'telegraf';

let cachedBotId: number | null = null;

/**
 * Initialize and cache the bot ID at startup
 */
export async function initializeBotInfo(bot: Telegraf): Promise<number> {
  if (cachedBotId === null) {
    const botInfo = await bot.telegram.getMe();
    cachedBotId = botInfo.id;
    console.log(`Bot ID cached: ${cachedBotId}`);
  }
  return cachedBotId;
}

/**
 * Get the cached bot ID (must call initializeBotInfo first)
 */
export function getBotId(): number | null {
  return cachedBotId;
}
