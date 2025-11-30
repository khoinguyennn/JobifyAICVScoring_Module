import { Router } from 'express';
import { CompanyController } from '@/controllers/companyController';
import { authenticate } from '@/middlewares/auth';
import { uploadCompanyLogo, handleUploadError } from '@/middlewares/upload';

const router = Router();
const companyController = new CompanyController();

// ===== RESTful COMPANY ROUTES =====

/**
 * Company Resource CRUD (RESTful approach)
 * GET /companies - List all companies (public)
 * GET /companies/me - Get current company profile
 * GET /companies/:id - Get company by ID (public profile)
 * PUT /companies/:id - Update company profile (owner only)
 * DELETE /companies/:id - Delete company account (owner only)
 */
router.get('/companies/me', authenticate, companyController.getCurrentCompany);
router.get('/companies/:id', companyController.getCompanyById);
router.get('/companies', companyController.getAllCompanies);
router.put('/companies/:id', authenticate, companyController.updateCompany);

/**
 * Company Sub-resources (RESTful nested resources)
 * PUT /companies/:id/intro - Update company introduction  
 * PUT /companies/:id/avatar - Upload company logo (multipart/form-data)
 */
router.put('/companies/:id/intro', authenticate, companyController.updateCompanyIntro);
router.put('/companies/:id/avatar', authenticate, uploadCompanyLogo, handleUploadError, companyController.updateCompanyAvatar);

// Note: Password change is in authRoutes as PUT /companies/:id/password
// Note: Company registration is in authRoutes as POST /companies
// Note: Company jobs are in jobRoutes as GET /companies/:id/jobs

export default router;
