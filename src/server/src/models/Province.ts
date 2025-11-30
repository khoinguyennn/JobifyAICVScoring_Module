import { Province } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Province Model - Quản lý thông tin tỉnh thành
 */
export class ProvinceModel {
  // Map từ database row sang Province object
  static fromRow(row: RowDataPacket): Province {
    return {
      id: row.id,
      name: row.name,
      nameWithType: row.nameWithType,
    };
  }

  // Map từ Province object sang database values
  static toRow(province: Province): any {
    return {
      id: province.id,
      name: province.name,
      nameWithType: province.nameWithType,
    };
  }

  // Helper functions
  static getProvinceByName(provinces: Province[], name: string): Province | undefined {
    return provinces.find(
      province => 
        province.name.toLowerCase() === name.toLowerCase() ||
        province.nameWithType.toLowerCase() === name.toLowerCase()
    );
  }

  static searchProvinces(provinces: Province[], query: string): Province[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return provinces;

    return provinces.filter(province =>
      province.name.toLowerCase().includes(searchTerm) ||
      province.nameWithType.toLowerCase().includes(searchTerm)
    );
  }

  // Group provinces by region (optional - có thể thêm field region vào database sau)
  static groupByRegion(provinces: Province[]): Record<string, Province[]> {
    const regions: Record<string, Province[]> = {
      'Miền Bắc': [],
      'Miền Trung': [],
      'Miền Nam': []
    };

    // Danh sách ID tỉnh thành theo miền (dựa trên data seed)
    const northProvinces = [1, 2, 3, 4, 5, 6, 7, 8, 24, 26, 27, 28, 29, 30, 34];
    const centralProvinces = [9, 10, 11, 12, 13, 14, 15, 25, 31, 32, 33];
    const southProvinces = [16, 17, 18, 19, 20, 21, 22, 23];

    provinces.forEach(province => {
      if (northProvinces.includes(province.id)) {
        regions['Miền Bắc'].push(province);
      } else if (centralProvinces.includes(province.id)) {
        regions['Miền Trung'].push(province);
      } else if (southProvinces.includes(province.id)) {
        regions['Miền Nam'].push(province);
      }
    });

    return regions;
  }

  // Validate province ID exists
  static isValidProvinceId(provinces: Province[], id: number): boolean {
    return provinces.some(province => province.id === id);
  }

  // Get major cities (thành phố trực thuộc trung ương)
  static getMajorCities(provinces: Province[]): Province[] {
    const majorCityIds = [7, 10, 16, 19, 24, 25]; // Hải Phòng, Đà Nẵng, HCM, Cần Thơ, Hà Nội, Huế
    return provinces.filter(province => majorCityIds.includes(province.id));
  }
}


