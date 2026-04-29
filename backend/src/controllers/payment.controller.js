import * as payment_service from '../services/payment.service.js'
import { sendSuccess } from '../utils/response.js'

export const createVnpay = async (req, res, next) => {
  try {
    const data = await payment_service.createVnpayPayment(
      req.user.user_id,
      req.body,
      req.ip
    )
    return sendSuccess(res, data, 'VNPAY url created', 201)
  } catch (error) {
    next(error)
  }
}

export const vnpayReturn = async (req, res, next) => {
  try {
    console.log('[VNPAY RETURN] query:', req.query)
    const data = await payment_service.handleVnpayReturn(req.query)
    return sendSuccess(res, data, 'VNPAY return received')
  } catch (error) {
    next(error)
  }
}

export const vnpayIpn = async (req, res, next) => {
  try {
    console.log('[VNPAY IPN] query:', req.query)
    const data = await payment_service.handleVnpayIpn(req.query)
    console.log('[VNPAY IPN] response:', data)
    return res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}

export const createCod = async (req, res, next) => {
  try {
    const data = await payment_service.createCodPayment(
      req.user.user_id,
      req.body
    )
    return sendSuccess(res, data, 'COD payment created', 201)
  } catch (error) {
    next(error)
  }
}

export const confirmCodDelivery = async (req, res, next) => {
  try {
    const data = await payment_service.confirmCodDelivery(req.params.orderId)
    return sendSuccess(res, data, 'COD payment confirmed')
  } catch (error) {
    next(error)
  }
}
