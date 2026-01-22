export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
}

export interface TTSResponse {
  audioBuffer: Buffer;
  mimeType: string;
}

export interface TranscriptionResponse {
  text: string;
}

export interface AIProvider {
  /**
   * Generate a chat completion response
   */
  chat(messages: Message[], systemPrompt?: string): Promise<AIResponse>;

  /**
   * Generate text-to-speech audio
   */
  textToSpeech?(text: string, voice?: string): Promise<TTSResponse>;

  /**
   * Transcribe audio to text
   */
  transcribeAudio?(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResponse>;

  /**
   * Get the provider name
   */
  getName(): string;
}

export interface ConversationContext {
  userId: string;
  messages: Message[];
  referenceMaterials?: string;
  tutorNotes?: string;
}
