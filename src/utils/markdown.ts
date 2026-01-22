/**
 * Escape special Markdown characters to prevent parse errors
 * when sending LLM-generated content to Telegram
 */
export function escapeMarkdown(text: string): string {
  // Characters that need escaping in Telegram Markdown
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

  let escaped = text;
  for (const char of specialChars) {
    escaped = escaped.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  }

  return escaped;
}

/**
 * Escape special characters for MarkdownV2 format
 * This is more strict but also more reliable
 */
export function escapeMarkdownV2(text: string): string {
  // All special characters in MarkdownV2
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Safely format a message for Telegram, falling back to plain text if needed
 * This removes markdown formatting to ensure the message always sends
 */
export function safeMessage(text: string): { text: string; parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML' } {
  // For LLM content, it's safest to send as plain text to avoid parse errors
  // The content may contain code blocks, special characters, etc.
  return { text };
}

/**
 * Format text with basic styling, escaping user/LLM content
 * Use this when you want to add formatting around dynamic content
 */
export function formatWithEscaping(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    // Escape the dynamic value
    const escaped = escapeMarkdownV2(value);
    result = result.replace(`{${key}}`, escaped);
  }
  return result;
}
