import { Context } from 'telegraf';
import { getLastBotMessage } from '../services/context';
import { getAIProvider, buildPinyinPrompt } from '../ai';
import { toPinyin, containsChinese, formatWithInlinePinyin } from '../utils/pinyin';

/**
 * Handle /pinyin command - get pinyin for the last bot message
 */
export async function handlePinyinCommand(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) {
    await ctx.reply('Unable to identify chat.');
    return;
  }

  const lastMessage = await getLastBotMessage(chatId);

  if (!lastMessage) {
    await ctx.reply("I haven't sent any messages yet. Start a conversation first!");
    return;
  }

  // Check if the message contains Chinese
  if (!containsChinese(lastMessage)) {
    await ctx.reply('The last message does not contain Chinese characters.');
    return;
  }

  await ctx.sendChatAction('typing');

  try {
    // Use local pinyin library for quick response
    const quickPinyin = toPinyin(lastMessage);
    const inlinePinyin = formatWithInlinePinyin(lastMessage);

    // Also use AI for more detailed breakdown
    const ai = getAIProvider();
    const prompt = buildPinyinPrompt(lastMessage);
    const response = await ai.chat([{ role: 'user', content: prompt }]);

    const reply = `📝 *Pinyin*

*Quick pinyin:*
${quickPinyin}

*Detailed breakdown:*
${response.content}`;

    await ctx.reply(reply, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Pinyin command error:', error);

    // Fall back to local pinyin if AI fails
    const quickPinyin = toPinyin(lastMessage);
    await ctx.reply(`📝 *Pinyin*\n\n${quickPinyin}`, { parse_mode: 'Markdown' });
  }
}

/**
 * Get pinyin for a specific text (used for replies)
 */
export async function getPinyinForText(text: string): Promise<string> {
  if (!containsChinese(text)) {
    return 'This text does not contain Chinese characters.';
  }

  try {
    const ai = getAIProvider();
    const prompt = buildPinyinPrompt(text);
    const response = await ai.chat([{ role: 'user', content: prompt }]);

    const quickPinyin = toPinyin(text);

    return `📝 *Pinyin*

*Quick:* ${quickPinyin}

${response.content}`;
  } catch (error) {
    console.error('Pinyin generation error:', error);
    const quickPinyin = toPinyin(text);
    return `📝 *Pinyin*\n\n${quickPinyin}`;
  }
}
