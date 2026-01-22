import { Context } from 'telegraf';
import { config } from '../config';

export async function handleHelpCommand(ctx: Context): Promise<void> {
  const helpText = `🌏 *Language Learning Bot*

I'm here to help you learn ${config.language.target}! Here's what I can do:

*Conversation*
Just send me a message in ${config.language.target} or ${config.language.native} and I'll respond naturally. Responses are delayed (${Math.floor(config.responseDelay.min / 60)}-${Math.floor(config.responseDelay.max / 60)} min) to make it feel like texting a real language partner.

*Commands*
/pinyin - Get pinyin for my last message
/translate - Get translation and breakdown of my last message
/pronounce - Get audio pronunciation of my last message
/word - Get today's word of the day
/level - Check or change your learning level
/instant - Toggle instant responses (no delay)
/status - Check bot status
/help - Show this help message

*Reply Features*
Reply to any of my messages with:
• "pinyin" or "拼音" - Get pinyin
• "translate" or "翻译" - Get translation
• "pronounce" or "发音" - Get audio

*Reference Materials*
Add your tutor notes (.txt, .md) and lesson presentations (.pptx, .pdf) to the \`reference-materials\` folder. I'll use them to personalize our conversations!

*Daily Word*
I'll send you a new word or phrase every day at your scheduled time.

Learning level: *${config.language.level}*
AI Provider: ${config.ai.provider}

Happy learning! 加油！💪`;

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
}
