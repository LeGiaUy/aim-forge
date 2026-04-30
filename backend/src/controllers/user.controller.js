import * as user_service from '../services/user.service.js'
import { sendSuccess } from '../utils/response.js'

export const getUsers = async (req, res, next) => {
  try {
    const result = await user_service.get_users(req.query)
    return sendSuccess(res, result, 'Users list')
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (req, res, next) => {
  try {
    const result = await user_service.get_user_by_id(req.params.id)
    return sendSuccess(res, result, 'User detail')
  } catch (error) {
    next(error)
  }
}

export const patchUserStatus = async (req, res, next) => {
  try {
    const result = await user_service.update_user_status(
      req.params.id,
      req.user.user_id,
      req.body.status
    )
    return sendSuccess(res, result, 'User status updated')
  } catch (error) {
    next(error)
  }
}

export const postUserRoles = async (req, res, next) => {
  try {
    const result = await user_service.assign_roles(
      req.params.id,
      req.body.role_ids,
      req.user.user_id
    )
    return sendSuccess(res, result, 'User roles updated')
  } catch (error) {
    next(error)
  }
}

export const getRoles = async (req, res, next) => {
  try {
    const result = await user_service.get_roles()
    return sendSuccess(res, result, 'Roles list')
  } catch (error) {
    next(error)
  }
}
