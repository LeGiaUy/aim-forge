import * as stats_service from '../services/stats.service.js'
import { sendSuccess } from '../utils/response.js'

export const getKpiStats = async (req, res, next) => {
  try {
    const data = await stats_service.getKpiStats(req.query)
    return sendSuccess(res, data, 'KPI stats retrieved')
  } catch (error) {
    next(error)
  }
}

export const getRevenueChart = async (req, res, next) => {
  try {
    const data = await stats_service.getRevenueChart(req.query)
    return sendSuccess(res, data, 'Revenue chart retrieved')
  } catch (error) {
    next(error)
  }
}

export const getOrderStatusStats = async (req, res, next) => {
  try {
    const data = await stats_service.getOrderStatusDistribution(req.query)
    return sendSuccess(res, data, 'Order status distribution retrieved')
  } catch (error) {
    next(error)
  }
}

export const getTopProducts = async (req, res, next) => {
  try {
    const data = await stats_service.getTopProducts(req.query)
    return sendSuccess(res, data, 'Top products retrieved')
  } catch (error) {
    next(error)
  }
}

export const getPaymentMethodStats = async (req, res, next) => {
  try {
    const data = await stats_service.getPaymentMethodStats(req.query)
    return sendSuccess(res, data, 'Payment method stats retrieved')
  } catch (error) {
    next(error)
  }
}

export const getFunnelStats = async (req, res, next) => {
  try {
    const data = await stats_service.getFunnelStats(req.query)
    return sendSuccess(res, data, 'Funnel stats retrieved')
  } catch (error) {
    next(error)
  }
}
