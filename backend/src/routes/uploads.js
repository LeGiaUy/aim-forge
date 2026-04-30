import { Router } from 'express'
import {
  uploadProfileAvatar,
  uploadBrandImages,
  uploadCategoryImages,
  uploadProductImages
} from '../controllers/uploadController.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { upload_images } from '../middlewares/upload.js'

const router = Router()

router.post(
  '/profile',
  requireAuth,
  upload_images.array('images', 1),
  uploadProfileAvatar
)
router.post(
  '/products',
  requireAuth,
  requireRole('admin'),
  upload_images.array('images', 10),
  uploadProductImages
)
router.post(
  '/categories',
  requireAuth,
  requireRole('admin'),
  upload_images.array('images', 5),
  uploadCategoryImages
)
router.post(
  '/brands',
  requireAuth,
  requireRole('admin'),
  upload_images.array('images', 5),
  uploadBrandImages
)

export default router
