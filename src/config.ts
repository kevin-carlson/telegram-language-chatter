import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export type AIProvider = 'openai' | 'gemini';
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Config {
  telegram: {
    botToken: string;
    userId: string;
    allowedUserIds: string[];
    restrictToAllowedUsers: boolean;
  };
  ai: {
    provider: AIProvider;
    openai: {
      apiKey: string;
      model: string;
    };
    gemini: {
      apiKey: string;
      model: string;
      ttsModel: string;
    };
  };
  language: {
    target: string;
    native: string;
    level: LearningLevel;
  };
  responseDelay: {
    min: number;
    max: number;
  };
  dailyWord: {
    cron: string;
    timezone: string;
  };
  database: {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  referenceMaterialsDir: string;
  debug: boolean;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvVarInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return parsed;
}

function getEnvVarBool(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

export function loadConfig(): Config {
  const provider = getEnvVar('AI_PROVIDER', 'gemini') as AIProvider;

  if (provider !== 'openai' && provider !== 'gemini') {
    throw new Error('AI_PROVIDER must be either "openai" or "gemini"');
  }

  // Validate that the necessary API key is present for the selected provider
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
  }
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when using Gemini provider');
  }

  const level = getEnvVar('LEARNING_LEVEL', 'beginner') as LearningLevel;
  if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
    throw new Error('LEARNING_LEVEL must be beginner, intermediate, or advanced');
  }

  // Parse allowed user IDs from comma-separated string
  const allowedUserIdsStr = getEnvVar('ALLOWED_USER_IDS', '');
  const allowedUserIds = allowedUserIdsStr
    ? allowedUserIdsStr.split(',').map(id => id.trim()).filter(id => id)
    : [];

  return {
    telegram: {
      botToken: getEnvVar('TELEGRAM_BOT_TOKEN'),
      userId: getEnvVar('TELEGRAM_USER_ID', ''),
      allowedUserIds,
      restrictToAllowedUsers: getEnvVarBool('RESTRICT_TO_ALLOWED_USERS', false),
    },
    ai: {
      provider,
      openai: {
        apiKey: getEnvVar('OPENAI_API_KEY', ''),
        model: getEnvVar('OPENAI_MODEL', 'gpt-4o'),
      },
      gemini: {
        apiKey: getEnvVar('GEMINI_API_KEY', ''),
        model: getEnvVar('GEMINI_MODEL', 'gemini-2.0-flash'),
        ttsModel: getEnvVar('GEMINI_TTS_MODEL', 'gemini-2.5-pro-preview-tts'),
      },
    },
    language: {
      target: getEnvVar('TARGET_LANGUAGE', 'Taiwanese Mandarin'),
      native: getEnvVar('NATIVE_LANGUAGE', 'English'),
      level,
    },
    responseDelay: {
      min: getEnvVarInt('RESPONSE_DELAY_MIN', 60),
      max: getEnvVarInt('RESPONSE_DELAY_MAX', 3600),
    },
    dailyWord: {
      cron: getEnvVar('DAILY_WORD_CRON', '0 9 * * *'),
      timezone: getEnvVar('TIMEZONE', 'America/New_York'),
    },
    database: {
      enabled: getEnvVarBool('USE_DATABASE', false),
      host: getEnvVar('MYSQL_HOST', 'localhost'),
      port: getEnvVarInt('MYSQL_PORT', 3306),
      user: getEnvVar('MYSQL_USER', 'language_bot'),
      password: getEnvVar('MYSQL_PASSWORD', ''),
      database: getEnvVar('MYSQL_DATABASE', 'language_chatter'),
    },
    referenceMaterialsDir: path.resolve(
      getEnvVar('REFERENCE_MATERIALS_DIR', './reference-materials')
    ),
    debug: getEnvVarBool('DEBUG', false),
  };
}

export const config = loadConfig();
