import { Context } from 'telegraf';
import { Message } from 'telegraf/types';
import { getPinyinForText } from '../commands/pinyin';
import { getTranslationForText } from '../commands/translate';
import { getPronunciationForText } from '../commands/pronounce';

// Keywords that trigger special reply actions
const PINYIN_KEYWORDS = ['pinyin', '拼音', 'pīnyīn', 'romanization'];
const TRANSLATE_KEYWORDS = ['translate', '翻译', 'translation', '翻譯', 'meaning', '意思'];
const PRONOUNCE_KEYWORDS = ['pronounce', '发音', 'pronunciation', '發音', 'audio', 'speak', '读'];

/**
 * Handle replies to bot messages
 */
export async function handleReply(ctx: Context): Promise<boolean> {
  const message = ctx.message as Message.TextMessage;
  if (!message?.text || !message.reply_to_message) return false;

  const replyTo = message.reply_to_message as Message.TextMessage;

  // Check if replying to a bot message
  const botInfo = await ctx.telegram.getMe();
  if (replyTo.from?.id !== botInfo.id) return false;

  // Get the text being replied to
  const targetText = replyTo.text;
  if (!targetText) return false;

  const userText = message.text.toLowerCase().trim();

  // Check for pinyin request
  if (PINYIN_KEYWORDS.some(kw => userText.includes(kw))) {
    await ctx.sendChatAction('typing');
    const pinyin = await getPinyinForText(targetText);
    await ctx.reply(pinyin, {
      parse_mode: 'Markdown',
      reply_to_message_id: message.message_id
    });
    return true;
  }

  // Check for translation request
  if (TRANSLATE_KEYWORDS.some(kw => userText.includes(kw))) {
    await ctx.sendChatAction('typing');
    const translation = await getTranslationForText(targetText);
    await ctx.reply(translation, {
      parse_mode: 'Markdown',
      reply_to_message_id: message.message_id
    });
    return true;
  }

  // Check for pronunciation request
  if (PRONOUNCE_KEYWORDS.some(kw => userText.includes(kw))) {
    await ctx.sendChatAction('record_voice');
    try {
      const audio = await getPronunciationForText(targetText);
      await ctx.replyWithVoice({
        source: audio.buffer,
        filename: 'pronunciation.ogg',
      });
    } catch (error) {
      console.error('Failed to generate pronunciation:', error);
      await ctx.reply(
        'Sorry, I could not generate the pronunciation. The TTS service may be unavailable.',
        { reply_to_message_id: message.message_id }
      );
    }
    return true;
  }

  // Not a special reply request, return false to handle as normal message
  return false;
}

/**
 * Get the original text from a replied message
 */
export function getReplyTargetText(ctx: Context): string | null {
  const message = ctx.message as Message.TextMessage;
  if (!message?.reply_to_message) return null;

  const replyTo = message.reply_to_message as Message.TextMessage;
  return replyTo.text || null;
}
