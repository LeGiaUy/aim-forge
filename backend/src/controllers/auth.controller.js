import * as auth_service from '../services/auth.service.js'
import { sendSuccess } from '../utils/response.js'

export const register = async (req, res, next) => {
  try {
    const result = await auth_service.register(req.body)
    return sendSuccess(res, result, 'Registered successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const result = await auth_service.login(req.body)
    return sendSuccess(res, result, 'Login successful')
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user_record = await auth_service.get_me(req.user.user_id)
    return sendSuccess(res, user_record, 'User profile')
  } catch (error) {
    next(error)
  }
}
