import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jobify_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Tạo connection pool
export const pool = mysql.createPool(dbConfig);

// Hàm test kết nối database
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    connection.release();
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error);
    throw error;
  }
};

export default pool;

