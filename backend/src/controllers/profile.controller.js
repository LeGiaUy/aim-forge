import * as profile_service from '../services/profile.service.js'
import { sendSuccess } from '../utils/response.js'

export const getMyProfile = async (req, res, next) => {
  try {
    const profile_data = await profile_service.get_my_profile(req.user.user_id)
    return sendSuccess(res, profile_data, 'Profile fetched')
  } catch (error) {
    next(error)
  }
}

export const updateMyProfile = async (req, res, next) => {
  try {
    const profile_data = await profile_service.update_my_profile(
      req.user.user_id,
      req.body
    )
    return sendSuccess(res, profile_data, 'Profile updated')
  } catch (error) {
    next(error)
  }
}

export const changeMyPassword = async (req, res, next) => {
  try {
    await profile_service.change_my_password(req.user.user_id, req.body)
    return sendSuccess(res, null, 'Password changed successfully')
  } catch (error) {
    next(error)
  }
}
