import { initDatabase } from './index';
import { ChatMessage } from '../services/aiChat';

/**
 * 保存聊天消息到数据库，并自动清理超过500条的旧消息
 */
export const saveChatMessage = async (message: ChatMessage): Promise<void> => {
  const db = await initDatabase();

  // 保存新消息
  await db.runAsync(
    `INSERT OR REPLACE INTO chat_messages (id, role, content, timestamp) VALUES (?, ?, ?, ?)`,
    [message.id, message.role, message.content, message.timestamp]
  );

  // 清理超过500条的旧消息
  await db.runAsync(`
    DELETE FROM chat_messages
    WHERE id NOT IN (
      SELECT id FROM chat_messages
      ORDER BY timestamp DESC
      LIMIT 500
    )
  `);
};

/**
 * 获取最近的聊天消息（最多500条）
 */
export const getRecentChatMessages = async (limit: number = 500): Promise<ChatMessage[]> => {
  const db = await initDatabase();
  const messages = await db.getAllAsync<ChatMessage>(
    `SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT ?`,
    [limit]
  );
  return messages.reverse();
};

/**
 * 删除指定的聊天消息
 */
export const deleteChatMessage = async (messageId: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync(
    `DELETE FROM chat_messages WHERE id = ?`,
    [messageId]
  );
};
