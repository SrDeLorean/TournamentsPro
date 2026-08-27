import mysql, { type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import type { ExecuteValues } from 'mysql2';

export type DatabaseParams = (ExecuteValues | undefined)[];

export interface DatabaseExecutor {
  queryRows<T = RowDataPacket>(sql: string, params?: DatabaseParams): Promise<T[]>;
  executeCommand(sql: string, params?: DatabaseParams): Promise<ResultSetHeader>;
}

// MySQL Connection Pool for XAMPP / Local MySQL Server
export const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tournamentspro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function sanitizeParams(params: DatabaseParams): ExecuteValues[] {
  return params.map((param) => (param === undefined ? null : param));
}

function createExecutor(connection: Pick<PoolConnection, 'execute'>): DatabaseExecutor {
  return {
    async queryRows<T = RowDataPacket>(sql: string, params: DatabaseParams = []): Promise<T[]> {
      const [rows] = await connection.execute(sql, sanitizeParams(params));
      return rows as unknown as T[];
    },
    async executeCommand(sql: string, params: DatabaseParams = []): Promise<ResultSetHeader> {
      const [result] = await connection.execute(sql, sanitizeParams(params));
      if (Array.isArray(result)) {
        throw new Error('executeCommand esperaba un resultado de escritura, pero recibió filas.');
      }
      return result as ResultSetHeader;
    },
  };
}

const poolExecutor = createExecutor(dbPool);

export const queryRows = poolExecutor.queryRows;
export const executeCommand = poolExecutor.executeCommand;

export async function executeCas(
  executor: DatabaseExecutor,
  sql: string,
  params: DatabaseParams,
  conflictMessage: string,
): Promise<ResultSetHeader> {
  const result = await executor.executeCommand(sql, params);
  if (result.affectedRows !== 1) throw new Error(conflictMessage);
  return result;
}

// Compatibility helper. New code should prefer queryRows for SELECT statements
// and executeCommand when affectedRows is required.
export async function queryDB<T = RowDataPacket>(sql: string, params: DatabaseParams = []): Promise<T[]> {
  try {
    return await queryRows<T>(sql, params);
  } catch (error) {
    console.error('MySQL Query Error:', error);
    throw error;
  }
}

export async function withTransaction<T>(
  operation: (transaction: DatabaseExecutor) => Promise<T>
): Promise<T> {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await operation(createExecutor(connection));
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
