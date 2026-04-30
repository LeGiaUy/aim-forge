import { authenticate } from '../middleware/auth.middleware.js'
import {
  authorize,
  authorizePermission
} from '../middleware/rbac.middleware.js'

export const requireAuth = authenticate
export const requireRole = (...role_names) => authorize(role_names)
export const requirePermission = permission_name =>
  authorizePermission([permission_name])
