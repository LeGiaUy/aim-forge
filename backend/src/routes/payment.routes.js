import { Router } from 'express'
import {
  confirmCodDelivery,
  createCod,
  createVnpay,
  vnpayIpn,
  vnpayReturn
} from '../controllers/payment.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const router = Router()

router.post('/create-vnpay', requireAuth, createVnpay)
router.get('/vnpay-return', vnpayReturn)
router.get('/vnpay-ipn', vnpayIpn)

router.post('/create-cod', requireAuth, createCod)
router.patch(
  '/cod/:orderId/confirm-delivery',
  requireAuth,
  requireRole('admin'),
  confirmCodDelivery
)

export default router
