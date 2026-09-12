import { executeCommand, queryDB, type DatabaseExecutor, type DatabaseParams } from '@/lib/db';
import type { Notification, INotificationRepository, FindOptions } from '@/lib/db/interfaces';
import type { NotificationRow } from './types';
import { randomUUID } from 'crypto';

export class NotificationRepository implements INotificationRepository {
  private tableInitialized = false;

  constructor(private readonly executor?: DatabaseExecutor) {}

  private async ensureTable(): Promise<void> {
    if (this.tableInitialized) return;
    try {
      await this.runCommand(`
        CREATE TABLE IF NOT EXISTS \`notifications\` (
          \`id\` VARCHAR(36) NOT NULL,
          \`user_id\` VARCHAR(36) NOT NULL,
          \`type\` ENUM('TRANSFER', 'MATCH', 'TOURNAMENT', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
          \`title\` VARCHAR(150) NOT NULL,
          \`description\` TEXT NOT NULL,
          \`action_url\` VARCHAR(255) NULL,
          \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`idx_notif_user_unread\` (\`user_id\`, \`is_read\`, \`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      this.tableInitialized = true;
    } catch (e) {
      console.warn('Error al verificar tabla notifications:', e);
    }
  }

  private queryRows<R>(sql: string, params: DatabaseParams = []): Promise<R[]> {
    return this.executor
      ? (this.executor.queryRows<R>(sql, params) as Promise<R[]>)
      : (queryDB<R>(sql, params) as Promise<R[]>);
  }

  private runCommand(sql: string, params: DatabaseParams = []) {
    return this.executor
      ? this.executor.executeCommand(sql, params)
      : executeCommand(sql, params);
  }

  private mapRow(row: NotificationRow): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      description: row.description,
      actionUrl: row.action_url,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<Notification | null> {
    await this.ensureTable();
    const rows = await this.queryRows<NotificationRow>(
      'SELECT * FROM notifications WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(options: FindOptions = {}): Promise<Notification[]> {
    await this.ensureTable();
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const rows = await this.queryRows<NotificationRow>(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows.map((row) => this.mapRow(row));
  }

  async findByUser(userId: string, options: { limit?: number; unreadOnly?: boolean } = {}): Promise<Notification[]> {
    await this.ensureTable();
    const limit = options.limit || 20;
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: DatabaseParams = [userId];

    if (options.unreadOnly) {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = await this.queryRows<NotificationRow>(sql, params);
    return rows.map((row) => this.mapRow(row));
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    await this.ensureTable();
    const result = await this.runCommand(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await this.ensureTable();
    const result = await this.runCommand(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.affectedRows >= 0;
  }

  async deleteByUser(id: string, userId: string): Promise<boolean> {
    await this.ensureTable();
    const result = await this.runCommand(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    await this.ensureTable();
    const id = data.id || `notif-${randomUUID().substring(0, 8)}`;
    if (!data.userId) throw new Error('user_id requerido para crear notificación');
    if (!data.title) throw new Error('title requerido para crear notificación');
    if (!data.description) throw new Error('description requerida para crear notificación');

    await this.runCommand(
      `INSERT INTO notifications (id, user_id, type, title, description, action_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.userId,
        data.type || 'SYSTEM',
        data.title,
        data.description,
        data.actionUrl || null,
        data.isRead ? 1 : 0,
      ]
    );

    return (await this.findById(id))!;
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification | null> {
    await this.ensureTable();
    const fields: string[] = [];
    const params: DatabaseParams = [];

    if (data.isRead !== undefined) {
      fields.push('is_read = ?');
      params.push(data.isRead ? 1 : 0);
    }
    if (data.title !== undefined) {
      fields.push('title = ?');
      params.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.actionUrl !== undefined) {
      fields.push('action_url = ?');
      params.push(data.actionUrl);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await this.runCommand(
      `UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureTable();
    const result = await this.runCommand('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async count(): Promise<number> {
    await this.ensureTable();
    const rows = await this.queryRows<{ total: number }>('SELECT COUNT(*) as total FROM notifications');
    return rows[0]?.total || 0;
  }
}
