import { Router } from 'express'
import {
  getFunnelStats,
  getKpiStats,
  getOrderStatusStats,
  getPaymentMethodStats,
  getRevenueChart,
  getTopProducts
} from '../controllers/stats.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('admin'))

router.get('/kpi', getKpiStats)
router.get('/revenue-chart', getRevenueChart)
router.get('/order-status', getOrderStatusStats)
router.get('/top-products', getTopProducts)
router.get('/payment-method', getPaymentMethodStats)
router.get('/funnel', getFunnelStats)

export default router
