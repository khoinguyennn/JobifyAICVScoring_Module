import { Router } from 'express';
import { ReferenceController } from '@/controllers/referenceController';

const router = Router();
const referenceController = new ReferenceController();

// ===== PROVINCES ROUTES =====
router.get('/provinces', referenceController.getAllProvinces);
router.get('/provinces/type', referenceController.getProvincesWithType);

// ===== FIELDS ROUTES =====
router.get('/fields', referenceController.getAllFields);
router.get('/fields/type', referenceController.getFieldsByType);

export default router;














































































