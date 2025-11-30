import { followCompanyRepository } from '@/repositories/followCompanyRepository';
import { companyRepository } from '@/repositories/companyRepository';
import { 
  CreateFollowCompanyDTO, 
  FollowCompanyQueryParams,
  FollowCompanyWithDetails,
  PaginatedResponse 
} from '@/types';

export class FollowCompanyService {
  /**
   * Theo dõi công ty cho user
   */
  async followCompany(followCompanyData: CreateFollowCompanyDTO): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Kiểm tra company có tồn tại không
      const companyExists = await companyRepository.findById(followCompanyData.idCompany);
      if (!companyExists) {
        return {
          success: false,
          message: 'Công ty không tồn tại hoặc đã bị xóa'
        };
      }

      // Kiểm tra user đã theo dõi company này chưa
      const isAlreadyFollowed = await followCompanyRepository.exists(followCompanyData.idUser, followCompanyData.idCompany);
      if (isAlreadyFollowed) {
        return {
          success: false,
          message: 'Bạn đã theo dõi công ty này rồi'
        };
      }

      // Theo dõi công ty
      const followCompanyId = await followCompanyRepository.create(followCompanyData);

      return {
        success: true,
        message: 'Theo dõi công ty thành công',
        data: {
          id: followCompanyId,
          idUser: followCompanyData.idUser,
          idCompany: followCompanyData.idCompany
        }
      };
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.followCompany:', error);
      throw new Error('Không thể theo dõi công ty');
    }
  }

  /**
   * Hủy theo dõi công ty
   */
  async unfollowCompany(idUser: number, idCompany: number): Promise<{ success: boolean; message: string }> {
    try {
      // Kiểm tra user đã theo dõi company này chưa
      const isFollowed = await followCompanyRepository.exists(idUser, idCompany);
      if (!isFollowed) {
        return {
          success: false,
          message: 'Bạn chưa theo dõi công ty này'
        };
      }

      // Hủy theo dõi công ty
      const isDeleted = await followCompanyRepository.delete(idUser, idCompany);
      if (!isDeleted) {
        return {
          success: false,
          message: 'Không thể hủy theo dõi công ty'
        };
      }

      return {
        success: true,
        message: 'Hủy theo dõi công ty thành công'
      };
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.unfollowCompany:', error);
      throw new Error('Không thể hủy theo dõi công ty');
    }
  }

  /**
   * Lấy danh sách công ty đã theo dõi của user
   */
  async getFollowedCompanies(
    idUser: number, 
    params: FollowCompanyQueryParams = {}
  ): Promise<PaginatedResponse<FollowCompanyWithDetails>> {
    try {
      return await followCompanyRepository.findByUser(idUser, params);
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.getFollowedCompanies:', error);
      throw new Error('Không thể lấy danh sách công ty đã theo dõi');
    }
  }

  /**
   * Kiểm tra xem user đã theo dõi company này chưa
   */
  async checkFollowStatus(idUser: number, idCompany: number): Promise<{ isFollowed: boolean }> {
    try {
      const isFollowed = await followCompanyRepository.exists(idUser, idCompany);
      return { isFollowed };
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.checkFollowStatus:', error);
      throw new Error('Không thể kiểm tra trạng thái theo dõi công ty');
    }
  }

  /**
   * Lấy số lượng công ty đã theo dõi của user
   */
  async getFollowedCompanyCount(idUser: number): Promise<{ count: number }> {
    try {
      const count = await followCompanyRepository.getCountByUser(idUser);
      return { count };
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.getFollowedCompanyCount:', error);
      throw new Error('Không thể lấy số lượng công ty đã theo dõi');
    }
  }

  /**
   * Lấy số lượng người theo dõi của một công ty
   */
  async getCompanyFollowerCount(idCompany: number): Promise<{ count: number }> {
    try {
      const count = await followCompanyRepository.getFollowerCount(idCompany);
      return { count };
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.getCompanyFollowerCount:', error);
      throw new Error('Không thể lấy số lượng người theo dõi công ty');
    }
  }

  /**
   * Lấy thống kê công ty được theo dõi nhiều nhất (cho admin)
   */
  async getPopularFollowedCompanies(limit: number = 10): Promise<any[]> {
    try {
      return await followCompanyRepository.getPopularFollowedCompanies(limit);
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.getPopularFollowedCompanies:', error);
      throw new Error('Không thể lấy thống kê công ty được theo dõi');
    }
  }

  /**
   * Lấy danh sách người theo dõi của một công ty (cho company)
   */
  async getCompanyFollowers(
    idCompany: number, 
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<any>> {
    try {
      return await followCompanyRepository.getFollowersByCompany(idCompany, params);
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.getCompanyFollowers:', error);
      throw new Error('Không thể lấy danh sách người theo dõi công ty');
    }
  }

  /**
   * Populate isFollowed field cho danh sách companies
   */
  async populateFollowStatus(companies: any[], idUser?: number): Promise<any[]> {
    try {
      if (!idUser) {
        // Nếu không có user, set tất cả isFollowed = false
        return companies.map(company => ({
          ...company,
          isFollowed: false
        }));
      }

      // Lấy danh sách company IDs mà user đã follow
      const followedCompanyIds = await followCompanyRepository.getFollowedCompanyIds(idUser);
      
      // Populate isFollowed field
      return companies.map(company => ({
        ...company,
        isFollowed: followedCompanyIds.includes(company.id)
      }));
    } catch (error) {
      console.error('🔥 Error in FollowCompanyService.populateFollowStatus:', error);
      // Trả về companies với isFollowed = false nếu có lỗi
      return companies.map(company => ({
        ...company,
        isFollowed: false
      }));
    }
  }
}

export const followCompanyService = new FollowCompanyService();
