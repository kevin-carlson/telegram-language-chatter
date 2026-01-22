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

interface MessageHandlerContext {
  bot: Telegraf;
  referenceMaterials?: string;
}

let handlerContext: MessageHandlerContext | null = null;

/**
 * Set the handler context
 */
export function setMessageHandlerContext(ctx: MessageHandlerContext): void {
  handlerContext = ctx;
}

/**
 * Handle incoming text messages
 */
export async function handleTextMessage(ctx: Context): Promise<void> {
  const message = ctx.message as Message.TextMessage;
  if (!message?.text) return;

  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  if (!chatId || !userId) return;

  const text = message.text;
  const messageId = message.message_id;

  // Skip commands (they're handled separately)
  if (text.startsWith('/')) return;

  // Save the user's message
  await addMessage(chatId.toString(), userId.toString(), 'user', text);

  // Generate AI response
  try {
    const response = await generateResponse(chatId.toString(), text);

    if (isInstantMode(chatId.toString())) {
      // Send immediately
      const sentMessage = await ctx.reply(response, {
        reply_to_message_id: messageId,
      });

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

      // Optionally send a "typing" indicator or subtle acknowledgment
      // For a more natural feel, we don't send anything
      if (config.debug) {
        console.log(
          `Scheduled response for chat ${chatId} in ${formatDelay(delay)}`
        );
      }
    }
  } catch (error) {
    console.error('Failed to handle message:', error);
    await ctx.reply(
      "I'm having trouble processing your message. Please try again."
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

  // Build system prompt with current level and materials
  const currentLevel = getCurrentLevel();
  // Ensure the language config reflects the current (possibly overridden) level
  config.language.level = currentLevel;

  const systemPrompt = buildSystemPrompt(
    handlerContext?.referenceMaterials,
    undefined // Tutor notes are included in reference materials
  );

  // Generate response
  const response = await ai.chat(messages, systemPrompt);

  return response.content;
}
