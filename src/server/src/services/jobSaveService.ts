import { jobSaveRepository } from '@/repositories/jobSaveRepository';
import { jobRepository } from '@/repositories/jobRepository';
import { 
  CreateSaveJobDTO, 
  SaveJobQueryParams,
  SaveJobWithDetails,
  PaginatedResponse 
} from '@/types';

export class JobSaveService {
  /**
   * Lưu công việc cho user
   */
  async saveJob(saveJobData: CreateSaveJobDTO): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Kiểm tra job có tồn tại không
      const jobExists = await jobRepository.findById(saveJobData.idJob);
      if (!jobExists) {
        return {
          success: false,
          message: 'Công việc không tồn tại hoặc đã bị xóa'
        };
      }

      // Kiểm tra user đã lưu job này chưa
      const isAlreadySaved = await jobSaveRepository.exists(saveJobData.idUser, saveJobData.idJob);
      if (isAlreadySaved) {
        return {
          success: false,
          message: 'Bạn đã lưu công việc này rồi'
        };
      }

      // Lưu công việc
      const saveJobId = await jobSaveRepository.create(saveJobData);

      return {
        success: true,
        message: 'Lưu công việc thành công',
        data: {
          id: saveJobId,
          idUser: saveJobData.idUser,
          idJob: saveJobData.idJob
        }
      };
    } catch (error) {
      console.error('🔥 Error in JobSaveService.saveJob:', error);
      throw new Error('Không thể lưu công việc');
    }
  }

  /**
   * Hủy lưu công việc
   */
  async unsaveJob(idUser: number, idJob: number): Promise<{ success: boolean; message: string }> {
    try {
      // Kiểm tra user đã lưu job này chưa
      const isSaved = await jobSaveRepository.exists(idUser, idJob);
      if (!isSaved) {
        return {
          success: false,
          message: 'Bạn chưa lưu công việc này'
        };
      }

      // Hủy lưu công việc
      const isDeleted = await jobSaveRepository.delete(idUser, idJob);
      if (!isDeleted) {
        return {
          success: false,
          message: 'Không thể hủy lưu công việc'
        };
      }

      return {
        success: true,
        message: 'Hủy lưu công việc thành công'
      };
    } catch (error) {
      console.error('🔥 Error in JobSaveService.unsaveJob:', error);
      throw new Error('Không thể hủy lưu công việc');
    }
  }

  /**
   * Lấy danh sách công việc đã lưu của user
   */
  async getSavedJobs(
    idUser: number, 
    params: SaveJobQueryParams = {}
  ): Promise<PaginatedResponse<SaveJobWithDetails>> {
    try {
      return await jobSaveRepository.findByUser(idUser, params);
    } catch (error) {
      console.error('🔥 Error in JobSaveService.getSavedJobs:', error);
      throw new Error('Không thể lấy danh sách công việc đã lưu');
    }
  }


  /**
   * Lấy số lượng công việc đã lưu của user
   */
  async getSavedJobCount(idUser: number): Promise<{ count: number }> {
    try {
      const count = await jobSaveRepository.getCountByUser(idUser);
      return { count };
    } catch (error) {
      console.error('🔥 Error in JobSaveService.getSavedJobCount:', error);
      throw new Error('Không thể lấy số lượng công việc đã lưu');
    }
  }

  /**
   * Lấy thống kê công việc được lưu nhiều nhất (cho admin)
   */
  async getPopularSavedJobs(limit: number = 10): Promise<any[]> {
    try {
      return await jobSaveRepository.getPopularSavedJobs(limit);
    } catch (error) {
      console.error('🔥 Error in JobSaveService.getPopularSavedJobs:', error);
      throw new Error('Không thể lấy thống kê công việc được lưu');
    }
  }

  /**
   * Kiểm tra xem user đã lưu job này chưa
   */
  async checkSaveStatus(idUser: number, idJob: number): Promise<{ isSaved: boolean }> {
    try {
      const isSaved = await jobSaveRepository.exists(idUser, idJob);
      return { isSaved };
    } catch (error) {
      console.error('🔥 Error in JobSaveService.checkSaveStatus:', error);
      throw new Error('Không thể kiểm tra trạng thái lưu công việc');
    }
  }

}

export const jobSaveService = new JobSaveService();
