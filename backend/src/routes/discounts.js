import { Router } from 'express'
import {
  createDiscount,
  deleteDiscount,
  getDiscounts,
  previewDiscount,
  updateDiscount
} from '../controllers/discountController.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), getDiscounts)
router.post('/preview', requireAuth, requireRole('admin'), previewDiscount)
router.post('/', requireAuth, requireRole('admin'), createDiscount)
router.put('/:id', requireAuth, requireRole('admin'), updateDiscount)
router.delete('/:id', requireAuth, requireRole('admin'), deleteDiscount)

export default router
