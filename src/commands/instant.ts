import { Context } from 'telegraf';

// Track instant mode per chat
const instantModeChats: Set<string> = new Set();

/**
 * Check if instant mode is enabled for a chat
 */
export function isInstantMode(chatId: string): boolean {
  return instantModeChats.has(chatId);
}

/**
 * Handle /instant command - toggle instant responses
 */
export async function handleInstantCommand(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) {
    await ctx.reply('Unable to identify chat.');
    return;
  }

  if (instantModeChats.has(chatId)) {
    instantModeChats.delete(chatId);
    await ctx.reply(
      `⏰ *Instant mode disabled*

Responses will now be delayed (1-60 minutes) to simulate texting with a real language partner.`,
      { parse_mode: 'Markdown' }
    );
  } else {
    instantModeChats.add(chatId);
    await ctx.reply(
      `⚡ *Instant mode enabled*

I'll respond immediately to your messages. Use /instant again to switch back to delayed responses.`,
      { parse_mode: 'Markdown' }
    );
  }
}
