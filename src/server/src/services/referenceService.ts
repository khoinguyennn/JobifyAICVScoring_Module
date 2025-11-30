import { ReferenceRepository } from '@/repositories/referenceRepository';
import { Province, Field, FieldWithJobCount, ProvinceWithJobCount } from '@/types';

export class ReferenceService {
  private referenceRepository: ReferenceRepository;

  constructor() {
    this.referenceRepository = new ReferenceRepository();
  }

  // ===== PROVINCES =====
  
  async getAllProvinces(): Promise<Province[]> {
    return await this.referenceRepository.getAllProvinces();
  }

  async getProvinceById(id: number): Promise<Province | null> {
    return await this.referenceRepository.getProvinceById(id);
  }

  async getAllProvincesWithJobCount(): Promise<ProvinceWithJobCount[]> {
    return await this.referenceRepository.getAllProvincesWithJobCount();
  }

  // ===== FIELDS =====
  
  async getAllFields(): Promise<Field[]> {
    return await this.referenceRepository.getAllFields();
  }

  async getFieldsByType(typeField: string): Promise<Field[]> {
    return await this.referenceRepository.getFieldsByType(typeField);
  }

  async getFieldsByTypeWithJobCount(typeField: string): Promise<FieldWithJobCount[]> {
    return await this.referenceRepository.getFieldsByTypeWithJobCount(typeField);
  }

  async getFieldById(id: number): Promise<Field | null> {
    return await this.referenceRepository.getFieldById(id);
  }

  async getUniqueFieldTypes(): Promise<string[]> {
    return await this.referenceRepository.getUniqueFieldTypes();
  }
}





















