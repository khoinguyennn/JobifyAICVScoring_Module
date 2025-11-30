import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authenticate, optionalAuthenticate } from '@/middlewares/auth';

const router = Router();
const authController = new AuthController();

// ===== RESTful AUTH ROUTES =====

/**
 * Authentication Sessions (RESTful approach)
 * POST /auth/users/sessions - User login (create session)
 * POST /auth/companies/sessions - Company login (create session)  
 * DELETE /auth/sessions - Logout (delete session)
 */
router.post('/auth/users/sessions', authController.loginUser);
router.post('/auth/companies/sessions', authController.loginCompany);
router.delete('/auth/sessions', optionalAuthenticate, authController.logout);

/**
 * User Registration (Resource creation)
 * POST /users - Register new user
 */
router.post('/users', authController.registerUser);

/**
 * Company Registration (Resource creation)  
 * POST /companies - Register new company
 */
router.post('/companies', authController.registerCompany);

/**
 * Password Management (Resource update)
 * PUT /users/:id/password - Change user password (RESTful standard)
 * POST /users/:id/password - Change user password (backward compatibility)
 * PUT /companies/:id/password - Change company password (RESTful standard) 
 * POST /companies/:id/password - Change company password (backward compatibility)
 */
router.put('/users/:id/password', authenticate, authController.changeUserPassword);
router.post('/users/:id/password', authenticate, authController.changeUserPassword); // Backward compatibility
router.put('/companies/:id/password', authenticate, authController.changeCompanyPassword);
router.post('/companies/:id/password', authenticate, authController.changeCompanyPassword); // Backward compatibility

/**
 * Password Reset (RESTful approach)
 * POST /auth/forgot-password - Request user password reset
 * PUT /auth/reset-password/:token - Reset user password with token
 * POST /auth/companies/forgot-password - Request company password reset
 * PUT /auth/companies/reset-password/:token - Reset company password with token
 */
router.post('/auth/forgot-password', authController.forgotPassword);
router.put('/auth/reset-password/:token', authController.resetPassword);
router.post('/auth/companies/forgot-password', authController.forgotCompanyPassword);
router.put('/auth/companies/reset-password/:token', authController.resetCompanyPassword);

export default router;



