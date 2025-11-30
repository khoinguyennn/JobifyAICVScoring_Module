import { Router } from 'express';
import { jobSaveController } from '@/controllers/jobSaveController';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// ===== SAVED JOBS ROUTES =====
// Tất cả routes này đều cần authentication và chỉ dành cho user (người tìm việc)

/**
 * @route   POST /saved-jobs
 * @desc    Lưu công việc vào danh sách yêu thích
 * @access  Private (User only)
 */
router.post('/', authenticate, jobSaveController.saveJob);

/**
 * @route   DELETE /saved-jobs/:jobId
 * @desc    Hủy lưu công việc khỏi danh sách yêu thích
 * @access  Private (User only)
 */
router.delete('/:jobId', authenticate, jobSaveController.unsaveJob);

/**
 * @route   GET /saved-jobs
 * @desc    Lấy danh sách công việc đã lưu của user
 * @access  Private (User only)
 */
router.get('/', authenticate, jobSaveController.getSavedJobs);


/**
 * @route   GET /saved-jobs/count
 * @desc    Lấy số lượng công việc đã lưu của user
 * @access  Private (User only)
 */
router.get('/count', authenticate, jobSaveController.getSavedJobCount);

/**
 * @route   GET /saved-jobs/check/:jobId
 * @desc    Kiểm tra xem user đã lưu job này chưa
 * @access  Private (User only)
 */
router.get('/check/:jobId', authenticate, jobSaveController.checkSaveStatus);

export default router;
