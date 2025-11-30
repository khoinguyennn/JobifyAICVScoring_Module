import { pool } from '@/config/database';
import { User, CreateUserDTO, UpdateUserDTO, PaginatedResponse, PaginationParams } from '@/types';
import { UserModel } from '@/models/User';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * UserRepository - Xử lý truy vấn database cho User
 */
export class UserRepository {
  // Tìm user theo ID với thông tin province
  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.*, p.name as provinceName, p.nameWithType as provinceFullName 
       FROM users u 
       LEFT JOIN provinces p ON u.idProvince = p.id 
       WHERE u.id = ?`,
      [id]
    );
    
    return rows.length > 0 ? UserModel.fromRow(rows[0]) : null;
  }

  // Tìm user theo email
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    return rows.length > 0 ? UserModel.fromRow(rows[0]) : null;
  }

  // Tạo user mới
  async create(userData: CreateUserDTO): Promise<User> {
    const userRow = UserModel.toRow(userData);
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password, idProvince, phone, sex) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userRow.name, userRow.email, userRow.password, userRow.idProvince, userRow.phone, userRow.sex]
    );

    const newUser = await this.findById(result.insertId);
    if (!newUser) {
      throw new Error('Không thể tạo user mới');
    }

    return newUser;
  }

  // Cập nhật thông tin user
  async update(id: number, userData: UpdateUserDTO): Promise<User | null> {
    const userRow = UserModel.toRow(userData);
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    Object.entries(userRow).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0 ? this.findById(id) : null;
  }

  // Cập nhật mật khẩu
  async updatePassword(id: number, hashedPassword: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    return result.affectedRows > 0;
  }

  // Xóa user (soft delete)
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Lấy danh sách users với pagination
  async findAll(params: PaginationParams & { search?: string; idProvince?: number }): Promise<PaginatedResponse<User>> {
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (params.search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (params.idProvince) {
      whereClause += ' AND u.idProvince = ?';
      queryParams.push(params.idProvince);
    }

    // Count total records
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // Get paginated data
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.*, p.name as provinceName, p.nameWithType as provinceFullName 
       FROM users u 
       LEFT JOIN provinces p ON u.idProvince = p.id 
       ${whereClause}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, params.limit, params.offset]
    );

    const users = rows.map(row => UserModel.fromRow(row));
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: users,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  }

  // Kiểm tra email đã tồn tại
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const params: any[] = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows[0].count > 0;
  }

  // Kiểm tra phone đã tồn tại
  async phoneExists(phone: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM users WHERE phone = ?';
    const params: any[] = [phone];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows[0].count > 0;
  }

  // Lấy thống kê users
  async getStats(): Promise<{
    totalUsers: number;
    newUsersThisMonth: number;
    usersByProvince: { provinceName: string; count: number }[];
  }> {
    // Total users
    const [totalRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM users'
    );
    const totalUsers = totalRows[0].total;

    // New users this month
    const [newRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users 
       WHERE YEAR(CURDATE()) = YEAR(CURDATE()) 
       AND MONTH(CURDATE()) = MONTH(CURDATE())`
    );
    const newUsersThisMonth = newRows[0].total;

    // Users by province
    const [provinceRows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.name as provinceName, COUNT(u.id) as count 
       FROM provinces p 
       LEFT JOIN users u ON u.idProvince = p.id 
       GROUP BY p.id, p.name 
       ORDER BY count DESC`
    );
    const usersByProvince = provinceRows.map(row => ({
      provinceName: row.provinceName,
      count: row.count
    }));

    return {
      totalUsers,
      newUsersThisMonth,
      usersByProvince
    };
  }

  // Tìm users theo danh sách IDs
  async findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.*, p.name as provinceName, p.nameWithType as provinceFullName 
       FROM users u 
       LEFT JOIN provinces p ON u.idProvince = p.id 
       WHERE u.id IN (${placeholders})`,
      ids
    );

    return rows.map(row => UserModel.fromRow(row));
  }
}


