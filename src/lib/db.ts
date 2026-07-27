import mysql from 'mysql2/promise';

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

// Helper for executing query with automatic fallback & undefined parameter sanitization
export async function queryDB<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    // Sanitize any JS undefined to SQL null to prevent mysql2 bind errors
    const sanitizedParams = params.map((p) => (p === undefined ? null : p));
    const [rows] = await dbPool.execute(sql, sanitizedParams);
    return rows as T[];
  } catch (error) {
    console.error('MySQL Query Error:', error);
    throw error;
  }
}
