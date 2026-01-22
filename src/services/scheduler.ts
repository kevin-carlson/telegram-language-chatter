import schedule from 'node-schedule';
import { config } from '../config';
import { getAIProvider, buildDailyWordPrompt } from '../ai';
import { getPreviousDailyWords, saveDailyWord } from '../database';
import { Telegraf } from 'telegraf';

let dailyWordJob: schedule.Job | null = null;

interface SchedulerContext {
  bot: Telegraf;
  referenceMaterials?: string;
}

/**
 * Start the daily word scheduler
 */
export function startDailyWordScheduler(context: SchedulerContext): void {
  const { bot, referenceMaterials } = context;

  if (!config.telegram.userId) {
    console.log('TELEGRAM_USER_ID not set, daily word scheduler disabled');
    return;
  }

  const cronExpression = config.dailyWord.cron;

  console.log(`Scheduling daily word with cron: ${cronExpression} (${config.dailyWord.timezone})`);

  dailyWordJob = schedule.scheduleJob(
    { rule: cronExpression, tz: config.dailyWord.timezone },
    async () => {
      console.log('Sending daily word...');
      await sendDailyWord(bot, referenceMaterials);
    }
  );

  console.log('Daily word scheduler started');
}

/**
 * Send the daily word to the configured user
 */
export async function sendDailyWord(
  bot: Telegraf,
  referenceMaterials?: string
): Promise<void> {
  try {
    const ai = getAIProvider();

    // Get previous words to avoid repetition
    const previousWords = await getPreviousDailyWords(30);

    // Build the prompt
    const prompt = buildDailyWordPrompt(previousWords, undefined, referenceMaterials);

    // Generate the daily word
    const response = await ai.chat([{ role: 'user', content: prompt }]);

    const content = response.content;

    // Try to extract the word for database storage
    const wordMatch = content.match(/Word of the Day\s*\n+([^\n]+)/);
    const word = wordMatch ? wordMatch[1].trim() : 'Unknown';

    // Extract pinyin if present
    const pinyinMatch = content.match(/Pinyin:\s*([^\n]+)/);
    const pinyin = pinyinMatch ? pinyinMatch[1].trim() : '';

    // Extract meaning/translation
    const meaningMatch = content.match(/Meaning:\s*([^\n]+)/);
    const translation = meaningMatch ? meaningMatch[1].trim() : '';

    // Save to database
    await saveDailyWord(word, pinyin, translation, content);

    // Send to user
    const userId = config.telegram.userId;
    await bot.telegram.sendMessage(userId, content, {
      parse_mode: 'Markdown',
    });

    console.log(`Daily word sent: ${word}`);
  } catch (error) {
    console.error('Failed to send daily word:', error);
  }
}

/**
 * Stop the daily word scheduler
 */
export function stopDailyWordScheduler(): void {
  if (dailyWordJob) {
    dailyWordJob.cancel();
    dailyWordJob = null;
    console.log('Daily word scheduler stopped');
  }
}

/**
 * Manually trigger a daily word (for testing)
 */
export async function triggerDailyWord(
  bot: Telegraf,
  chatId: number,
  referenceMaterials?: string
): Promise<string> {
  try {
    const ai = getAIProvider();

    // Get previous words to avoid repetition
    const previousWords = await getPreviousDailyWords(30);

    // Build the prompt
    const prompt = buildDailyWordPrompt(previousWords, undefined, referenceMaterials);

    // Generate the daily word
    const response = await ai.chat([{ role: 'user', content: prompt }]);

    const content = response.content;

    // Save to database
    const wordMatch = content.match(/Word of the Day\s*\n+([^\n]+)/);
    const word = wordMatch ? wordMatch[1].trim() : 'Unknown';
    const pinyinMatch = content.match(/Pinyin:\s*([^\n]+)/);
    const pinyin = pinyinMatch ? pinyinMatch[1].trim() : '';
    const meaningMatch = content.match(/Meaning:\s*([^\n]+)/);
    const translation = meaningMatch ? meaningMatch[1].trim() : '';

    await saveDailyWord(word, pinyin, translation, content);

    return content;
  } catch (error) {
    console.error('Failed to generate daily word:', error);
    throw error;
  }
}
