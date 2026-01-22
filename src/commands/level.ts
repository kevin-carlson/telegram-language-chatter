import { Context } from 'telegraf';
import { config, LearningLevel } from '../config';

// Runtime level override (since we can't modify env vars at runtime)
let levelOverride: LearningLevel | null = null;

/**
 * Get the current learning level
 */
export function getCurrentLevel(): LearningLevel {
  return levelOverride || config.language.level;
}

/**
 * Handle /level command - check or change learning level
 */
export async function handleLevelCommand(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (!message || !('text' in message)) {
    await ctx.reply('Invalid message.');
    return;
  }

  const text = message.text;
  const parts = text.split(/\s+/);

  if (parts.length === 1) {
    // Just /level - show current level
    const currentLevel = getCurrentLevel();
    await ctx.reply(
      `📊 *Current Learning Level:* ${currentLevel}

To change your level, use:
/level beginner
/level intermediate
/level advanced

*Level descriptions:*
• *Beginner* - Simple vocabulary, pinyin with all new words, basic sentences
• *Intermediate* - More complex sentences, pinyin for difficult words only
• *Advanced* - Natural conversations, minimal pinyin, native-like responses`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const newLevel = parts[1].toLowerCase();

  if (!['beginner', 'intermediate', 'advanced'].includes(newLevel)) {
    await ctx.reply(
      'Invalid level. Please use: beginner, intermediate, or advanced'
    );
    return;
  }

  levelOverride = newLevel as LearningLevel;
  await ctx.reply(
    `✅ Learning level changed to: *${newLevel}*

I'll adjust my responses accordingly!`,
    { parse_mode: 'Markdown' }
  );
}
