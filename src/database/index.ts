import mysql from 'mysql2/promise';
import { config } from '../config';

export interface MessageRecord {
  id: number;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

export interface DailyWordRecord {
  id: number;
  word: string;
  pinyin: string;
  translation: string;
  full_content: string;
  sent_at: Date;
}

export interface ConversationRecord {
  id: number;
  chat_id: string;
  started_at: Date;
  last_message_at: Date;
}

let pool: mysql.Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): mysql.Pool | null {
  if (!config.database.enabled) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
}

/**
 * Initialize the database tables
 */
export async function initializeDatabase(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    console.log('Database disabled, skipping initialization');
    return;
  }

  console.log('Initializing database...');

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chat_id VARCHAR(50) NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_id (chat_id),
      INDEX idx_created_at (created_at)
    )
  `;

  const createDailyWordsTable = `
    CREATE TABLE IF NOT EXISTS daily_words (
      id INT AUTO_INCREMENT PRIMARY KEY,
      word VARCHAR(100) NOT NULL,
      pinyin VARCHAR(200),
      translation VARCHAR(500),
      full_content TEXT NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sent_at (sent_at)
    )
  `;

  const createConversationsTable = `
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chat_id VARCHAR(50) NOT NULL UNIQUE,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chat_id (chat_id)
    )
  `;

  try {
    await pool.execute(createMessagesTable);
    await pool.execute(createDailyWordsTable);
    await pool.execute(createConversationsTable);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save a message to the database
 */
export async function saveMessage(
  chatId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.execute(
      'INSERT INTO messages (chat_id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [chatId, userId, role, content]
    );

    // Update or create conversation record
    await pool.execute(
      `INSERT INTO conversations (chat_id) VALUES (?)
       ON DUPLICATE KEY UPDATE last_message_at = CURRENT_TIMESTAMP`,
      [chatId]
    );
  } catch (error) {
    console.error('Failed to save message:', error);
  }
}

/**
 * Get recent messages for a chat
 */
export async function getRecentMessages(
  chatId: string,
  limit: number = 20
): Promise<MessageRecord[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    // Use query() instead of execute() because prepared statements
    // have issues with LIMIT clause parameters in MySQL2
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM messages
       WHERE chat_id = ?
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`,
      [chatId]
    );

    return (rows as MessageRecord[]).reverse();
  } catch (error) {
    console.error('Failed to get recent messages:', error);
    return [];
  }
}

/**
 * Save a daily word
 */
export async function saveDailyWord(
  word: string,
  pinyin: string,
  translation: string,
  fullContent: string
): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.execute(
      'INSERT INTO daily_words (word, pinyin, translation, full_content) VALUES (?, ?, ?, ?)',
      [word, pinyin, translation, fullContent]
    );
  } catch (error) {
    console.error('Failed to save daily word:', error);
  }
}

/**
 * Get previous daily words
 */
export async function getPreviousDailyWords(limit: number = 30): Promise<string[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    // Use query() instead of execute() because prepared statements
    // have issues with LIMIT clause parameters in MySQL2
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT word FROM daily_words ORDER BY sent_at DESC LIMIT ${safeLimit}`,
      []
    );

    return (rows as { word: string }[]).map(r => r.word);
  } catch (error) {
    console.error('Failed to get previous daily words:', error);
    return [];
  }
}

/**
 * Close the database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
