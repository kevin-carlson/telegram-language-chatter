import { Context } from 'telegraf';
import { getLastBotMessage } from '../services/context';
import { getAIProvider } from '../ai';

/**
 * Handle /pronounce command - get audio pronunciation of the last bot message
 */
export async function handlePronounceCommand(ctx: Context): Promise<void> {
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

  await ctx.sendChatAction('record_voice');

  try {
    const audio = await getPronunciationForText(lastMessage);
    await ctx.replyWithVoice({
      source: audio.buffer,
      filename: 'pronunciation.ogg',
    });
  } catch (error) {
    console.error('Pronounce command error:', error);
    await ctx.reply(
      'Sorry, I had trouble generating the pronunciation. The TTS service may be unavailable. Please try again later.'
    );
  }
}

/**
 * Get pronunciation audio for a specific text (used for replies)
 */
export async function getPronunciationForText(
  text: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const ai = getAIProvider();

  if (!ai.textToSpeech) {
    throw new Error('Text-to-speech is not available for the current AI provider');
  }

  const response = await ai.textToSpeech(text);

  return {
    buffer: response.audioBuffer,
    mimeType: response.mimeType,
  };
}
