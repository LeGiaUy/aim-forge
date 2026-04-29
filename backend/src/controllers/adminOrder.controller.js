import * as adminOrderService from '../services/adminOrder.service.js'
import { sendSuccess } from '../utils/response.js'

export const getAdminOrders = async (req, res, next) => {
  try {
    const data = await adminOrderService.getAdminOrders(req.query)
    return sendSuccess(res, data, 'Admin orders retrieved')
  } catch (error) {
    next(error)
  }
}

export const getAdminOrderById = async (req, res, next) => {
  try {
    const data = await adminOrderService.getAdminOrderById(req.params.id)
    return sendSuccess(res, data, 'Admin order detail retrieved')
  } catch (error) {
    next(error)
  }
}

export const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const data = await adminOrderService.updateOrderStatus(
      req.params.id,
      req.body?.newStatus
    )
    return sendSuccess(res, data, 'Order status updated')
  } catch (error) {
    next(error)
  }
}
