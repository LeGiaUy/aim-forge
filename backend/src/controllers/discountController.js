import * as discount_service from '../services/discountService.js'
import { sendSuccess } from '../utils/response.js'

export const getDiscounts = async (req, res, next) => {
  try {
    const data = await discount_service.getDiscounts(req.query)
    return sendSuccess(res, data, 'Discounts retrieved')
  } catch (error) {
    return next(error)
  }
}

export const createDiscount = async (req, res, next) => {
  try {
    const data = await discount_service.createDiscount(req.body)
    return sendSuccess(res, data, 'Discount created', 201)
  } catch (error) {
    return next(error)
  }
}

export const updateDiscount = async (req, res, next) => {
  try {
    const data = await discount_service.updateDiscount(req.params.id, req.body)
    return sendSuccess(res, data, 'Discount updated')
  } catch (error) {
    return next(error)
  }
}

export const deleteDiscount = async (req, res, next) => {
  try {
    await discount_service.deleteDiscount(req.params.id)
    return sendSuccess(res, null, 'Discount deleted')
  } catch (error) {
    return next(error)
  }
}

export const previewDiscount = async (req, res, next) => {
  try {
    const data = await discount_service.previewDiscount(req.body)
    return sendSuccess(res, data, 'Discount preview')
  } catch (error) {
    return next(error)
  }
}
