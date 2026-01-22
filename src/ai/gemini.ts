import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { AIProvider, AIResponse, Message, TranscriptionResponse, TTSResponse } from './types';
import { config } from '../config';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;
  private ttsModel: string;

  constructor() {
    this.client = new GoogleGenerativeAI(config.ai.gemini.apiKey);
    this.model = config.ai.gemini.model;
    this.ttsModel = config.ai.gemini.ttsModel;
  }

  getName(): string {
    return 'Gemini';
  }

  async chat(messages: Message[], systemPrompt?: string): Promise<AIResponse> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    // Convert messages to Gemini format
    const contents: Content[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // System messages are handled via systemInstruction
        continue;
      }

      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Ensure we have at least one user message
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    const chat = model.startChat({
      history: contents.slice(0, -1),
    });

    const lastMessage = contents[contents.length - 1];
    const result = await chat.sendMessage(lastMessage.parts.map(p => (p as { text: string }).text).join(''));

    const response = result.response;
    const content = response.text();

    return { content };
  }

  async textToSpeech(text: string, voice?: string): Promise<TTSResponse> {
    // Use Gemini 2.5 Pro Preview TTS
    // This uses the Live API or a dedicated TTS endpoint
    // For now, we'll use a REST API approach

    const apiKey = config.ai.gemini.apiKey;
    const ttsModel = this.ttsModel;

    // Gemini TTS API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`;

    const voiceName = voice || this.getDefaultVoiceForLanguage();

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Please speak the following text in ${config.language.target}: "${text}"`,
            },
          ],
        },
      ],
      generationConfig: {
        response_modalities: ['AUDIO'],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: voiceName,
            },
          },
        },
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API Error:', errorText);
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract audio data from response
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (!audioData) {
        throw new Error('No audio data in response');
      }

      const audioBuffer = Buffer.from(audioData.data, 'base64');

      return {
        audioBuffer,
        mimeType: audioData.mimeType || 'audio/mp3',
      };
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw error;
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResponse> {
    const model = this.client.getGenerativeModel({ model: this.model });

    // Convert audio buffer to base64
    const base64Audio = audioBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        },
      },
      {
        text: `Please transcribe this audio. The speaker is likely speaking in ${config.language.target} or ${config.language.native}. Provide only the transcription without any additional commentary.`,
      },
    ]);

    const response = result.response;
    const text = response.text().trim();

    return { text };
  }

  private getDefaultVoiceForLanguage(): string {
    // Map languages to appropriate Gemini TTS voices
    const targetLang = config.language.target.toLowerCase();

    // Gemini TTS voice options
    // These may need to be updated based on available voices
    if (targetLang.includes('mandarin') || targetLang.includes('chinese')) {
      return 'Aoede'; // A voice that supports multiple languages
    }
    if (targetLang.includes('japanese')) {
      return 'Aoede';
    }
    if (targetLang.includes('korean')) {
      return 'Aoede';
    }

    // Default voice
    return 'Aoede';
  }
}
