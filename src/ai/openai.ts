import OpenAI from 'openai';
import { AIProvider, AIResponse, Message, TranscriptionResponse, TTSResponse } from './types';
import { config } from '../config';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });
    this.model = config.ai.openai.model;
  }

  getName(): string {
    return 'OpenAI';
  }

  async chat(messages: Message[], systemPrompt?: string): Promise<AIResponse> {
    const formattedMessages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      });
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens;

    return { content, tokensUsed };
  }

  async textToSpeech(text: string, voice: string = 'alloy'): Promise<TTSResponse> {
    const response = await this.client.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      response_format: 'opus',
    });

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return {
      audioBuffer,
      mimeType: 'audio/ogg',
    };
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResponse> {
    // Write buffer to temp file as OpenAI SDK requires a file
    const tempDir = os.tmpdir();
    const extension = mimeType.includes('ogg') ? 'ogg' : 'mp3';
    const tempFile = path.join(tempDir, `audio_${Date.now()}.${extension}`);

    try {
      fs.writeFileSync(tempFile, audioBuffer);

      const response = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        language: this.getLanguageCode(),
      });

      return { text: response.text };
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  private getLanguageCode(): string {
    // Map common language names to ISO codes
    const languageMap: Record<string, string> = {
      'taiwanese mandarin': 'zh',
      'mandarin': 'zh',
      'chinese': 'zh',
      'japanese': 'ja',
      'korean': 'ko',
      'spanish': 'es',
      'french': 'fr',
      'german': 'de',
      'italian': 'it',
      'portuguese': 'pt',
      'russian': 'ru',
      'english': 'en',
    };

    const targetLang = config.language.target.toLowerCase();
    return languageMap[targetLang] || 'zh';
  }
}
