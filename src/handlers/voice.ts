import { Context, Telegraf } from 'telegraf';
import { Message } from 'telegraf/types';
import { getAIProvider, buildSystemPrompt, Message as AIMessage } from '../ai';
import {
  addMessage,
  getConversationHistory,
  storeBotMessage,
} from '../services/context';
import { scheduleResponse, formatDelay } from '../services/delay';
import { isInstantMode } from '../commands/instant';
import { getCurrentLevel } from '../commands/level';
import { config } from '../config';
import https from 'https';
import http from 'http';

interface VoiceHandlerContext {
  bot: Telegraf;
  referenceMaterials?: string;
}

let handlerContext: VoiceHandlerContext | null = null;

/**
 * Set the handler context
 */
export function setVoiceHandlerContext(ctx: VoiceHandlerContext): void {
  handlerContext = ctx;
}

/**
 * Download a file from Telegram
 */
async function downloadFile(fileUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = fileUrl.startsWith('https') ? https : http;

    protocol.get(fileUrl, (response) => {
      const chunks: Buffer[] = [];

      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Handle incoming voice messages
 */
export async function handleVoiceMessage(ctx: Context): Promise<void> {
  const message = ctx.message as Message.VoiceMessage;
  if (!message?.voice) return;

  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  if (!chatId || !userId) return;

  const messageId = message.message_id;

  await ctx.sendChatAction('typing');

  try {
    // Get file info
    const fileId = message.voice.file_id;
    const file = await ctx.telegram.getFile(fileId);

    if (!file.file_path) {
      throw new Error('Could not get file path');
    }

    // Download the voice file
    const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${file.file_path}`;
    const audioBuffer = await downloadFile(fileUrl);

    // Determine MIME type
    const mimeType = message.voice.mime_type || 'audio/ogg';

    // Transcribe the audio
    const ai = getAIProvider();

    if (!ai.transcribeAudio) {
      await ctx.reply(
        'Voice transcription is not available with the current AI provider.',
        { reply_to_message_id: messageId }
      );
      return;
    }

    const transcription = await ai.transcribeAudio(audioBuffer, mimeType);
    const transcribedText = transcription.text;

    // Send transcription to user (without parse_mode to handle special characters)
    await ctx.reply(`🎤 I heard: "${transcribedText}"`, {
      reply_to_message_id: messageId,
    });

    // Save the transcribed message
    await addMessage(
      chatId.toString(),
      userId.toString(),
      'user',
      `[Voice message]: ${transcribedText}`
    );

    // Generate AI response
    const response = await generateResponse(chatId.toString(), transcribedText);

    if (isInstantMode(chatId.toString())) {
      // Send immediately
      const sentMessage = await ctx.reply(response);

      // Store and save the bot's message
      await addMessage(
        chatId.toString(),
        'bot',
        'assistant',
        response,
        sentMessage.message_id
      );
      await storeBotMessage(chatId.toString(), sentMessage.message_id, response);
    } else {
      // Schedule delayed response
      const { delay } = scheduleResponse(
        chatId,
        messageId,
        response,
        async (cid, resp, replyTo) => {
          const sentMessage = await ctx.telegram.sendMessage(cid, resp, {
            reply_to_message_id: replyTo,
          });

          // Store and save the bot's message
          await addMessage(
            cid.toString(),
            'bot',
            'assistant',
            resp,
            sentMessage.message_id
          );
          await storeBotMessage(cid.toString(), sentMessage.message_id, resp);
        }
      );

      if (config.debug) {
        console.log(
          `Scheduled response for voice message in chat ${chatId} in ${formatDelay(delay)}`
        );
      }
    }
  } catch (error) {
    console.error('Failed to handle voice message:', error);
    await ctx.reply(
      "I couldn't process your voice message. Please try again or send a text message.",
      { reply_to_message_id: messageId }
    );
  }
}

/**
 * Generate an AI response based on conversation history
 */
async function generateResponse(
  chatId: string,
  userMessage: string
): Promise<string> {
  const ai = getAIProvider();

  // Get conversation history
  const history = await getConversationHistory(chatId, 20);

  // Build the messages array
  const messages: AIMessage[] = [...history];

  // Add the current message if not already in history
  if (messages.length === 0 || messages[messages.length - 1].content !== userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  // Build system prompt with current level
  const currentLevel = getCurrentLevel();
  const systemPrompt = buildSystemPrompt(
    handlerContext?.referenceMaterials,
    undefined,
    currentLevel
  );

  // Generate response
  const response = await ai.chat(messages, systemPrompt);

  return response.content;
}
