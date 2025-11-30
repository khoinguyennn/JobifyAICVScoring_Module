import { Router } from 'express';
import { followCompanyController } from '@/controllers/followCompanyController';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// ===== FOLLOWED COMPANIES ROUTES =====
// Tất cả routes này đều cần authentication và chỉ dành cho user (người tìm việc)

/**
 * @route   POST /followed-companies
 * @desc    Theo dõi công ty vào danh sách yêu thích
 * @access  Private (User only)
 */
router.post('/', authenticate, followCompanyController.followCompany);

/**
 * @route   DELETE /followed-companies/:companyId
 * @desc    Hủy theo dõi công ty khỏi danh sách yêu thích
 * @access  Private (User only)
 */
router.delete('/:companyId', authenticate, followCompanyController.unfollowCompany);

/**
 * @route   GET /followed-companies
 * @desc    Lấy danh sách công ty đã theo dõi của user
 * @access  Private (User only)
 */
router.get('/', authenticate, followCompanyController.getFollowedCompanies);

/**
 * @route   GET /followed-companies/count
 * @desc    Lấy số lượng công ty đã theo dõi của user
 * @access  Private (User only)
 */
router.get('/count', authenticate, followCompanyController.getFollowedCompanyCount);

/**
 * @route   GET /followed-companies/check/:companyId
 * @desc    Kiểm tra xem user đã theo dõi công ty này chưa
 * @access  Private (User only)
 */
router.get('/check/:companyId', authenticate, followCompanyController.checkFollowStatus);

export default router;
