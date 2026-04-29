import { Router } from 'express'
import {
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderStatus
} from '../controllers/adminOrder.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('admin'))

router.get('/', getAdminOrders)
router.get('/:id', getAdminOrderById)
router.patch('/:id/status', updateAdminOrderStatus)

export default router
