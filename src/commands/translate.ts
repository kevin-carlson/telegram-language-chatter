import { Context } from 'telegraf';
import { getLastBotMessage } from '../services/context';
import { getAIProvider, buildTranslationPrompt } from '../ai';

/**
 * Handle /translate command - get translation of the last bot message
 */
export async function handleTranslateCommand(ctx: Context): Promise<void> {
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

  await ctx.sendChatAction('typing');

  try {
    const translation = await getTranslationForText(lastMessage);
    // Send without parse_mode to avoid issues with LLM-generated special characters
    await ctx.reply(translation);
  } catch (error) {
    console.error('Translate command error:', error);
    await ctx.reply('Sorry, I had trouble generating the translation. Please try again.');
  }
}

/**
 * Get translation for a specific text (used for replies)
 * Note: Returns plain text to avoid Markdown parse errors with LLM content
 */
export async function getTranslationForText(text: string): Promise<string> {
  try {
    const ai = getAIProvider();
    const prompt = buildTranslationPrompt(text);
    const response = await ai.chat([{ role: 'user', content: prompt }]);

    return `🔤 Translation

Original:
${text}

${response.content}`;
  } catch (error) {
    console.error('Translation generation error:', error);
    throw error;
  }
}
