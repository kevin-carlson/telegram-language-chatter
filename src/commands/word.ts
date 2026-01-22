import { Context } from 'telegraf';
import { triggerDailyWord } from '../services/scheduler';
import { Telegraf } from 'telegraf';

let botInstance: Telegraf | null = null;
let referenceMaterials: string | undefined;

/**
 * Set the bot instance for the word command
 */
export function setWordCommandContext(bot: Telegraf, materials?: string): void {
  botInstance = bot;
  referenceMaterials = materials;
}

/**
 * Handle /word command - get today's word of the day
 */
export async function handleWordCommand(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    await ctx.reply('Unable to identify chat.');
    return;
  }

  await ctx.sendChatAction('typing');

  try {
    if (!botInstance) {
      await ctx.reply('Bot not properly initialized. Please try again later.');
      return;
    }

    const content = await triggerDailyWord(botInstance, chatId, referenceMaterials);
    await ctx.reply(content, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Word command error:', error);
    await ctx.reply('Sorry, I had trouble generating the word of the day. Please try again.');
  }
}
