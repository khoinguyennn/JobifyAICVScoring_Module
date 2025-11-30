import { pool } from '@/config/database';
import { Province, Field, FieldWithJobCount, ProvinceWithJobCount } from '@/types';
import { ProvinceModel } from '@/models/Province';
import { FieldModel } from '@/models/Field';
import { RowDataPacket } from 'mysql2';

/**
 * ReferenceRepository - Xử lý truy vấn database cho dữ liệu tham chiếu (provinces, fields)
 */
export class ReferenceRepository {
  // ==================== PROVINCES ====================
  
  async getAllProvinces(): Promise<Province[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, nameWithType FROM provinces ORDER BY name ASC'
    );
    
    return rows.map(row => ProvinceModel.fromRow(row));
  }

  async getProvinceById(id: number): Promise<Province | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, nameWithType FROM provinces WHERE id = ?',
      [id]
    );
    
    return rows.length > 0 ? ProvinceModel.fromRow(rows[0]) : null;
  }

  async getAllProvincesWithJobCount(): Promise<ProvinceWithJobCount[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.id, 
        p.name, 
        p.nameWithType,
        COUNT(j.id) as jobCount
       FROM provinces p 
       LEFT JOIN jobs j ON p.id = j.idProvince AND j.deletedAt IS NULL
       GROUP BY p.id, p.name, p.nameWithType
       ORDER BY p.name ASC`
    );
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameWithType: row.nameWithType,
      jobCount: row.jobCount || 0
    }));
  }

  async searchProvinces(query: string): Promise<Province[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, nameWithType FROM provinces 
       WHERE name LIKE ? OR nameWithType LIKE ? 
       ORDER BY name`,
      [`%${query}%`, `%${query}%`]
    );
    
    return rows.map(row => ProvinceModel.fromRow(row));
  }

  async getProvincesByRegion(): Promise<Record<string, Province[]>> {
    const provinces = await this.getAllProvinces();
    return ProvinceModel.groupByRegion(provinces);
  }

  async getMajorCities(): Promise<Province[]> {
    const provinces = await this.getAllProvinces();
    return ProvinceModel.getMajorCities(provinces);
  }

  // ==================== FIELDS ====================
  
  async getAllFields(): Promise<Field[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, typeField FROM fields ORDER BY typeField, name ASC'
    );
    
    return rows.map(row => FieldModel.fromRow(row));
  }

  async getFieldById(id: number): Promise<Field | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, typeField FROM fields WHERE id = ?',
      [id]
    );
    
    return rows.length > 0 ? FieldModel.fromRow(rows[0]) : null;
  }

  async getFieldsByType(typeField: string): Promise<Field[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, typeField FROM fields WHERE typeField = ? ORDER BY name ASC',
      [typeField]
    );
    
    return rows.map(row => FieldModel.fromRow(row));
  }

  async getFieldsByTypeWithJobCount(typeField: string): Promise<FieldWithJobCount[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        f.id, 
        f.name, 
        f.typeField,
        COUNT(j.id) as jobCount
       FROM fields f 
       LEFT JOIN jobs j ON f.id = j.idField AND j.deletedAt IS NULL
       WHERE f.typeField = ?
       GROUP BY f.id, f.name, f.typeField
       ORDER BY f.name ASC`,
      [typeField]
    );
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      typeField: row.typeField,
      jobCount: row.jobCount || 0
    }));
  }

  async searchFields(query: string): Promise<Field[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, typeField FROM fields 
       WHERE name LIKE ? OR typeField LIKE ? 
       ORDER BY typeField, name`,
      [`%${query}%`, `%${query}%`]
    );
    
    return rows.map(row => FieldModel.fromRow(row));
  }

  async getUniqueFieldTypes(): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT DISTINCT typeField FROM fields WHERE typeField IS NOT NULL ORDER BY typeField ASC'
    );
    
    return rows.map(row => row.typeField);
  }

  async getFieldsGroupedByType(): Promise<Record<string, Field[]>> {
    const fields = await this.getAllFields();
    return FieldModel.groupByType(fields);
  }

  async getPopularFields(): Promise<Field[]> {
    const fields = await this.getAllFields();
    return FieldModel.getPopularFields(fields);
  }

  // ==================== VALIDATION & UTILITIES ====================
  
  async validateIds(provinceId?: number, fieldId?: number): Promise<{ validProvince: boolean; validField: boolean }> {
    const results = { validProvince: true, validField: true };

    if (provinceId) {
      const province = await this.getProvinceById(provinceId);
      results.validProvince = !!province;
    }

    if (fieldId) {
      const field = await this.getFieldById(fieldId);
      results.validField = !!field;
    }

    return results;
  }

  async getReferenceDataSummary(): Promise<{
    provincesCount: number;
    fieldsCount: number;
    fieldTypesCount: number;
  }> {
    const [provinceRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM provinces'
    );

    const [fieldRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM fields'
    );

    const [fieldTypeRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(DISTINCT typeField) as count FROM fields'
    );

    return {
      provincesCount: provinceRows[0].count,
      fieldsCount: fieldRows[0].count,
      fieldTypesCount: fieldTypeRows[0].count
    };
  }

  async getAllReferenceData(): Promise<{
    provinces: Province[];
    fields: Field[];
    fieldTypes: string[];
    fieldsByType: Record<string, Field[]>;
    majorCities: Province[];
  }> {
    const [provinces, fields, fieldTypes] = await Promise.all([
      this.getAllProvinces(),
      this.getAllFields(),
      this.getUniqueFieldTypes()
    ]);

    const fieldsByType = FieldModel.groupByType(fields);
    const majorCities = ProvinceModel.getMajorCities(provinces);

    return {
      provinces,
      fields,
      fieldTypes,
      fieldsByType,
      majorCities
    };
  }
}


