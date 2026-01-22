import { Context } from 'telegraf';
import { config } from '../config';
import { getCurrentLevel } from './level';
import { isInstantMode } from './instant';
import { getPendingResponseInfo, formatDelay } from '../services/delay';
import fs from 'fs';

/**
 * Handle /status command - show bot status
 */
export async function handleStatusCommand(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) {
    await ctx.reply('Unable to identify chat.');
    return;
  }

  const instantMode = isInstantMode(chatId);
  const pendingInfo = getPendingResponseInfo(chatId);
  const level = getCurrentLevel();

  // Count reference materials
  let materialsCount = 0;
  try {
    if (fs.existsSync(config.referenceMaterialsDir)) {
      const countFiles = (dir: string): number => {
        let count = 0;
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const path = `${dir}/${item}`;
          const stat = fs.statSync(path);
          if (stat.isDirectory()) {
            count += countFiles(path);
          } else {
            count++;
          }
        }
        return count;
      };
      materialsCount = countFiles(config.referenceMaterialsDir);
    }
  } catch {
    materialsCount = 0;
  }

  let statusText = `📊 *Bot Status*

*Language Settings*
• Target: ${config.language.target}
• Native: ${config.language.native}
• Level: ${level}

*AI Provider*
• Provider: ${config.ai.provider}
• Model: ${config.ai.provider === 'openai' ? config.ai.openai.model : config.ai.gemini.model}

*Response Mode*
• Instant mode: ${instantMode ? '⚡ ON' : '⏰ OFF'}
• Delay range: ${Math.floor(config.responseDelay.min / 60)}-${Math.floor(config.responseDelay.max / 60)} minutes
`;

  if (pendingInfo.hasPending && pendingInfo.timeUntilResponse !== undefined) {
    statusText += `• Pending response in: ${formatDelay(pendingInfo.timeUntilResponse)}
`;
  }

  statusText += `
*Daily Word*
• Schedule: ${config.dailyWord.cron}
• Timezone: ${config.dailyWord.timezone}

*Database*
• Enabled: ${config.database.enabled ? '✅ Yes' : '❌ No'}

*Reference Materials*
• Directory: ${config.referenceMaterialsDir}
• Files loaded: ${materialsCount}
`;

  await ctx.reply(statusText, { parse_mode: 'Markdown' });
}
