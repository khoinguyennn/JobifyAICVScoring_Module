import { Field } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Field Model - Quản lý thông tin lĩnh vực công việc
 */
export class FieldModel {
  // Map từ database row sang Field object
  static fromRow(row: RowDataPacket): Field {
    return {
      id: row.id,
      name: row.name,
      typeField: row.typeField,
    };
  }

  // Map từ Field object sang database values
  static toRow(field: Field): any {
    return {
      id: field.id,
      name: field.name,
      typeField: field.typeField,
    };
  }

  // Helper functions
  static getFieldByName(fields: Field[], name: string): Field | undefined {
    return fields.find(field => 
      field.name.toLowerCase() === name.toLowerCase()
    );
  }

  static searchFields(fields: Field[], query: string): Field[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return fields;

    return fields.filter(field =>
      field.name.toLowerCase().includes(searchTerm) ||
      field.typeField.toLowerCase().includes(searchTerm)
    );
  }

  // Group fields by typeField
  static groupByType(fields: Field[]): Record<string, Field[]> {
    const grouped: Record<string, Field[]> = {};

    fields.forEach(field => {
      if (!grouped[field.typeField]) {
        grouped[field.typeField] = [];
      }
      grouped[field.typeField].push(field);
    });

    return grouped;
  }

  // Get popular fields (có thể dựa trên số lượng job posting)
  static getPopularFields(fields: Field[]): Field[] {
    // Danh sách ID của những lĩnh vực phổ biến
    const popularFieldIds = [26, 27, 12, 13, 15, 19, 34, 35]; // CNTT, Kế toán, Bán hàng, etc.
    return fields.filter(field => popularFieldIds.includes(field.id));
  }

  // Get fields by type
  static getFieldsByType(fields: Field[], typeField: string): Field[] {
    return fields.filter(field => field.typeField === typeField);
  }

  // Get all unique types
  static getAllTypes(fields: Field[]): string[] {
    const types = new Set(fields.map(field => field.typeField));
    return Array.from(types).sort();
  }

  // Validate field ID exists
  static isValidFieldId(fields: Field[], id: number): boolean {
    return fields.some(field => field.id === id);
  }

  // Search fields within a specific type
  static searchFieldsInType(fields: Field[], typeField: string, query: string): Field[] {
    const fieldsInType = this.getFieldsByType(fields, typeField);
    return this.searchFields(fieldsInType, query);
  }

  // Get recommended fields based on a field (similar type)
  static getRecommendedFields(fields: Field[], fieldId: number, limit: number = 5): Field[] {
    const currentField = fields.find(f => f.id === fieldId);
    if (!currentField) return [];

    const sameTypeFields = fields.filter(f => 
      f.typeField === currentField.typeField && f.id !== fieldId
    );

    return sameTypeFields.slice(0, limit);
  }

  // Get field statistics (có thể mở rộng với job count, etc.)
  static getFieldStats(fields: Field[]): { totalFields: number; totalTypes: number; fieldsByType: Record<string, number> } {
    const types = this.getAllTypes(fields);
    const fieldsByType: Record<string, number> = {};

    types.forEach(type => {
      fieldsByType[type] = fields.filter(f => f.typeField === type).length;
    });

    return {
      totalFields: fields.length,
      totalTypes: types.length,
      fieldsByType
    };
  }
}


