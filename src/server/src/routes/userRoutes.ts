import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { authenticate } from '@/middlewares/auth';
import { uploadUserAvatar, handleUploadError } from '@/middlewares/upload';

const router = Router();
const userController = new UserController();

// ===== RESTful USER ROUTES =====

/**
 * User Resource CRUD (RESTful approach)
 * GET /users/:id - Get user by ID (public profile)
 * GET /users/me - Get current user profile 
 * PUT /users/:id - Update user profile (owner only)
 * DELETE /users/:id - Delete user account (owner only)
 */
router.get('/users/me', authenticate, userController.getCurrentUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', authenticate, userController.updateUser);

/**
 * User Sub-resources (RESTful nested resources)
 * PUT /users/:id/intro - Update user introduction
 * PUT /users/:id/avatar - Upload user avatar (multipart/form-data)
 */
router.put('/users/:id/intro', authenticate, userController.updateUserIntro);
router.put('/users/:id/avatar', authenticate, uploadUserAvatar, handleUploadError, userController.updateUserAvatar);

// Note: Password change is in authRoutes as PUT /users/:id/password
// Note: User registration is in authRoutes as POST /users

export default router;



