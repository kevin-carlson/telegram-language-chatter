import { config } from '../config';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { AIProvider } from './types';

export * from './types';

let aiProviderInstance: AIProvider | null = null;

/**
 * Get the configured AI provider instance (singleton)
 */
export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    if (config.ai.provider === 'openai') {
      aiProviderInstance = new OpenAIProvider();
    } else {
      aiProviderInstance = new GeminiProvider();
    }

    console.log(`AI Provider initialized: ${aiProviderInstance.getName()}`);
  }

  return aiProviderInstance;
}

/**
 * Build the system prompt for language learning conversations
 */
export function buildSystemPrompt(
  referenceMaterials?: string,
  tutorNotes?: string,
  levelOverride?: string
): string {
  const level = levelOverride || config.language.level;
  const target = config.language.target;
  const native = config.language.native;

  let prompt = `You are a friendly language learning tutor helping someone learn ${target}.
The student's native language is ${native} and their current level is ${level}.

Your primary goal is to have natural conversations in ${target} to help the student practice reading and writing.

CRITICAL RESPONSE FORMAT RULES:
- Respond ONLY in ${target} characters. Do NOT include pinyin or romanization.
- Do NOT include translations. The student will request translations separately if needed.
- Your responses should contain ONLY ${target} text.
- Adjust vocabulary and sentence complexity for a ${level} learner, but always use only ${target} characters.

Guidelines:
- Be encouraging but correct mistakes gently using only ${target}
- When the student makes errors, provide the correct form naturally in your response
- Occasionally introduce new vocabulary related to the conversation topic
- Keep responses conversational and engaging
- If asked about grammar or vocabulary in ${native}, you may explain in ${native}, but otherwise stay in ${target}

`;

  if (tutorNotes) {
    prompt += `
TUTOR NOTES:
The following are notes from the student's language tutor containing vocabulary and concepts they've been learning.
Please incorporate these words and concepts into conversations when relevant:

${tutorNotes}

`;
  }

  if (referenceMaterials) {
    prompt += `
REFERENCE MATERIALS:
The following content comes from the student's learning materials (lessons, presentations, etc.).
Use this context to make conversations more relevant to what they're studying:

${referenceMaterials}

`;
  }

  prompt += `
Remember: Your goal is to create an immersive language learning experience through natural conversation.
Respond as if you're a patient, knowledgeable language partner who genuinely wants to help the student improve.
IMPORTANT: Always respond using ONLY ${target} characters. Never include pinyin, romanization, or translations unless explicitly asked in ${native}.
`;

  return prompt;
}

/**
 * Build prompt for getting pinyin of text
 */
export function buildPinyinPrompt(text: string): string {
  return `Please provide the pinyin (romanization) for the following ${config.language.target} text.
Format: Show each character followed by its pinyin, then a complete pinyin reading.

Text: ${text}

Respond in this format:
Characters with pinyin: [character1](pinyin1) [character2](pinyin2) ...
Full pinyin: [complete pinyin reading with tone marks]`;
}

/**
 * Build prompt for translation
 */
export function buildTranslationPrompt(text: string): string {
  return `Please translate the following text and provide a detailed breakdown.

Text: ${text}

Provide:
1. Translation to ${config.language.native}
2. Pinyin (if applicable)
3. Word-by-word breakdown with individual meanings
4. Any relevant grammar notes or usage tips`;
}

/**
 * Build prompt for generating a daily word/phrase
 */
export function buildDailyWordPrompt(
  previousWords: string[] = [],
  tutorNotes?: string,
  referenceMaterials?: string
): string {
  const level = config.language.level;
  const target = config.language.target;
  const native = config.language.native;

  let prompt = `Generate a word or phrase of the day for a ${level} level ${target} learner.

Requirements:
- Choose a practical, commonly-used word or phrase
- Appropriate for ${level} level
- Include: the word/phrase, pinyin, ${native} translation
- Provide 2-3 example sentences using the word
- Include a brief cultural note or usage tip if relevant

`;

  if (previousWords.length > 0) {
    prompt += `
Previously taught words (avoid repeating these):
${previousWords.slice(-30).join(', ')}

`;
  }

  if (tutorNotes) {
    prompt += `
The student has been learning these words/concepts with their tutor. Consider choosing related vocabulary:
${tutorNotes.substring(0, 1000)}

`;
  }

  if (referenceMaterials) {
    prompt += `
From their learning materials, consider vocabulary from:
${referenceMaterials.substring(0, 1000)}

`;
  }

  prompt += `
Format your response as:
📚 Word of the Day

[Word in ${target}]
Pinyin: [pinyin]
Meaning: [${native} translation]

Examples:
1. [Example sentence]
   [Pinyin]
   [Translation]

2. [Example sentence]
   [Pinyin]
   [Translation]

💡 Tip: [Usage tip or cultural note]
`;

  return prompt;
}
