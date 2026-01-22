import { Context } from 'telegraf';
import { triggerDailyWord } from '../services/scheduler';

type MaterialsGetter = () => string | undefined;

let getMaterials: MaterialsGetter = () => undefined;

/**
 * Set the materials getter for the word command
 */
export function setWordCommandContext(materialsGetter: MaterialsGetter): void {
  getMaterials = materialsGetter;
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
    // Get current materials via getter (reflects live updates)
    const content = await triggerDailyWord(getMaterials());
    // Send without parse_mode to avoid issues with LLM-generated special characters
    await ctx.reply(content);
  } catch (error) {
    console.error('Word command error:', error);
    await ctx.reply('Sorry, I had trouble generating the word of the day. Please try again.');
  }
}
