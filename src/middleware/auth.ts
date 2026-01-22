import { Context, MiddlewareFn } from 'telegraf';
import { config } from '../config';

/**
 * Middleware to restrict bot access to allowed users only
 */
export function createAuthMiddleware(): MiddlewareFn<Context> {
  return async (ctx, next) => {
    // If restriction is disabled, allow all users
    if (!config.telegram.restrictToAllowedUsers) {
      return next();
    }

    const userId = ctx.from?.id?.toString();

    if (!userId) {
      console.log('Auth: No user ID found in context');
      return; // Silently ignore messages without user ID
    }

    // Check if user is in the allowed list
    if (isUserAllowed(userId)) {
      return next();
    }

    // User not allowed - log and optionally respond
    console.log(`Auth: Unauthorized access attempt from user ${userId}`);

    // Send a polite rejection message (optional - can be disabled)
    if (ctx.message) {
      await ctx.reply(
        'Sorry, this bot is private and restricted to specific users. ' +
        'If you believe you should have access, please contact the bot owner.'
      );
    }

    // Don't call next() - stop processing
  };
}

/**
 * Check if a user ID is in the allowed list
 */
export function isUserAllowed(userId: string): boolean {
  if (!config.telegram.restrictToAllowedUsers) {
    return true;
  }

  // Check the allowed list
  if (config.telegram.allowedUserIds.includes(userId)) {
    return true;
  }

  // Also check TELEGRAM_USER_ID (the primary user for daily words)
  if (config.telegram.userId && config.telegram.userId === userId) {
    return true;
  }

  return false;
}

/**
 * Get list of allowed user IDs for display
 */
export function getAllowedUserIds(): string[] {
  const allowed = [...config.telegram.allowedUserIds];

  // Include the primary user ID if set and not already in list
  if (config.telegram.userId && !allowed.includes(config.telegram.userId)) {
    allowed.push(config.telegram.userId);
  }

  return allowed;
}
