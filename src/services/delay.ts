import { config } from '../config';

interface PendingResponse {
  chatId: number;
  messageId: number;
  response: string;
  scheduledTime: number;
  timer: NodeJS.Timeout;
}

const pendingResponses: Map<string, PendingResponse> = new Map();

/**
 * Get a random delay between min and max seconds
 */
export function getRandomDelay(): number {
  const min = config.responseDelay.min * 1000;
  const max = config.responseDelay.max * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Schedule a delayed response
 */
export function scheduleResponse(
  chatId: number,
  messageId: number,
  response: string,
  sendCallback: (chatId: number, response: string, replyToMessageId?: number) => Promise<void>
): { delay: number; cancelKey: string } {
  const delay = getRandomDelay();
  const cancelKey = `${chatId}-${messageId}`;

  // Cancel any existing pending response for this chat
  cancelPendingResponse(chatId.toString());

  const timer = setTimeout(async () => {
    try {
      await sendCallback(chatId, response, messageId);
      pendingResponses.delete(cancelKey);
    } catch (error) {
      console.error('Failed to send delayed response:', error);
      pendingResponses.delete(cancelKey);
    }
  }, delay);

  const pending: PendingResponse = {
    chatId,
    messageId,
    response,
    scheduledTime: Date.now() + delay,
    timer,
  };

  pendingResponses.set(cancelKey, pending);

  return { delay, cancelKey };
}

/**
 * Cancel a pending response by chat ID
 */
export function cancelPendingResponse(chatId: string): boolean {
  for (const [key, pending] of pendingResponses.entries()) {
    if (key.startsWith(chatId + '-')) {
      clearTimeout(pending.timer);
      pendingResponses.delete(key);
      return true;
    }
  }
  return false;
}

/**
 * Cancel a specific pending response
 */
export function cancelSpecificResponse(cancelKey: string): boolean {
  const pending = pendingResponses.get(cancelKey);
  if (pending) {
    clearTimeout(pending.timer);
    pendingResponses.delete(cancelKey);
    return true;
  }
  return false;
}

/**
 * Get info about pending response for a chat
 */
export function getPendingResponseInfo(chatId: string): {
  hasPending: boolean;
  timeUntilResponse?: number;
} {
  for (const [key, pending] of pendingResponses.entries()) {
    if (key.startsWith(chatId + '-')) {
      return {
        hasPending: true,
        timeUntilResponse: Math.max(0, pending.scheduledTime - Date.now()),
      };
    }
  }
  return { hasPending: false };
}

/**
 * Format delay for human-readable display
 */
export function formatDelay(delayMs: number): string {
  const seconds = Math.floor(delayMs / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Clear all pending responses (for shutdown)
 */
export function clearAllPendingResponses(): void {
  for (const pending of pendingResponses.values()) {
    clearTimeout(pending.timer);
  }
  pendingResponses.clear();
}
