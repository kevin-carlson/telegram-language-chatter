import { Message } from '../ai/types';
import { getRecentMessages, saveMessage as dbSaveMessage } from '../database';
import { config } from '../config';

interface ChatContext {
  messages: Message[];
  lastBotMessage?: string;
  lastBotMessageId?: number;
}

// In-memory storage for chat contexts when database is disabled
const chatContexts: Map<string, ChatContext> = new Map();

// Maximum messages to keep in memory per chat
const MAX_MESSAGES_IN_MEMORY = 50;

/**
 * Get or create a chat context
 */
export async function getChatContext(chatId: string): Promise<ChatContext> {
  // Try to get from memory first
  let context = chatContexts.get(chatId);

  if (!context) {
    context = {
      messages: [],
    };

    // If database is enabled, load recent messages
    if (config.database.enabled) {
      const dbMessages = await getRecentMessages(chatId, 20);
      context.messages = dbMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    }

    chatContexts.set(chatId, context);
  }

  return context;
}

/**
 * Add a message to the chat context
 */
export async function addMessage(
  chatId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  messageId?: number
): Promise<void> {
  const context = await getChatContext(chatId);

  // Add to in-memory context
  context.messages.push({ role, content });

  // Track last bot message for reply functionality
  if (role === 'assistant') {
    context.lastBotMessage = content;
    context.lastBotMessageId = messageId;
  }

  // Trim if too many messages
  if (context.messages.length > MAX_MESSAGES_IN_MEMORY) {
    context.messages = context.messages.slice(-MAX_MESSAGES_IN_MEMORY);
  }

  // Save to database if enabled
  if (config.database.enabled) {
    await dbSaveMessage(chatId, userId, role, content);
  }
}

/**
 * Get the conversation history as Message array
 */
export async function getConversationHistory(
  chatId: string,
  limit: number = 20
): Promise<Message[]> {
  const context = await getChatContext(chatId);
  return context.messages.slice(-limit);
}

/**
 * Get the last bot message for a chat
 */
export async function getLastBotMessage(chatId: string): Promise<string | undefined> {
  const context = await getChatContext(chatId);
  return context.lastBotMessage;
}

/**
 * Get the last bot message ID for a chat
 */
export async function getLastBotMessageId(chatId: string): Promise<number | undefined> {
  const context = await getChatContext(chatId);
  return context.lastBotMessageId;
}

/**
 * Store a specific bot message for later retrieval (for reply handling)
 */
export async function storeBotMessage(
  chatId: string,
  messageId: number,
  content: string
): Promise<void> {
  const context = await getChatContext(chatId);
  context.lastBotMessage = content;
  context.lastBotMessageId = messageId;
}

/**
 * Clear chat context
 */
export function clearChatContext(chatId: string): void {
  chatContexts.delete(chatId);
}

/**
 * Clear all chat contexts (for shutdown)
 */
export function clearAllContexts(): void {
  chatContexts.clear();
}
