import { sendError } from '../utils/response.js'

const get_user_roles = user_record =>
  (user_record.roles || []).map(role_link => role_link.role.role_name)

const get_user_permissions = user_record =>
  (user_record.roles || []).flatMap(role_link =>
    (role_link.role.permissions || []).map(
      role_permission => role_permission.permission.permission_name
    )
  )

export const authorize = allowed_roles => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401)
  }

  const role_names = get_user_roles(req.user).map(role_name =>
    role_name.toUpperCase()
  )
  const normalized_allowed_roles = (allowed_roles || []).map(role_name =>
    String(role_name).toUpperCase()
  )

  const is_allowed = normalized_allowed_roles.some(role_name =>
    role_names.includes(role_name)
  )
  if (!is_allowed) {
    return sendError(res, 'Forbidden - insufficient role', 403)
  }

  return next()
}

export const authorizePermission = allowed_permissions => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401)
  }

  const permission_names = get_user_permissions(req.user)
  const is_allowed = (allowed_permissions || []).some(permission_name =>
    permission_names.includes(permission_name)
  )
  if (!is_allowed) {
    return sendError(res, 'Forbidden - insufficient permission', 403)
  }

  return next()
}
