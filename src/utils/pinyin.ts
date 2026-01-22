import { pinyin } from 'pinyin-pro';

/**
 * Convert Chinese text to pinyin
 */
export function toPinyin(text: string): string {
  return pinyin(text, { toneType: 'symbol', type: 'string' });
}

/**
 * Convert Chinese text to pinyin with tone numbers
 */
export function toPinyinWithNumbers(text: string): string {
  return pinyin(text, { toneType: 'num', type: 'string' });
}

/**
 * Get pinyin for each character
 */
export function toPinyinArray(text: string): string[] {
  return pinyin(text, { toneType: 'symbol', type: 'array' });
}

/**
 * Check if text contains Chinese characters
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Get character-by-character breakdown with pinyin
 */
export function getCharacterBreakdown(text: string): { char: string; pinyin: string }[] {
  const chars = text.split('');
  const pinyinArr = toPinyinArray(text);

  return chars.map((char, i) => ({
    char,
    pinyin: pinyinArr[i] || char,
  }));
}

/**
 * Format text with inline pinyin
 */
export function formatWithInlinePinyin(text: string): string {
  const breakdown = getCharacterBreakdown(text);
  return breakdown
    .map(({ char, pinyin }) => {
      if (containsChinese(char)) {
        return `${char}(${pinyin})`;
      }
      return char;
    })
    .join('');
}

/**
 * Format as ruby annotation style (for HTML)
 */
export function formatAsRuby(text: string): string {
  const breakdown = getCharacterBreakdown(text);
  return breakdown
    .map(({ char, pinyin }) => {
      if (containsChinese(char)) {
        return `<ruby>${char}<rp>(</rp><rt>${pinyin}</rt><rp>)</rp></ruby>`;
      }
      return char;
    })
    .join('');
}
