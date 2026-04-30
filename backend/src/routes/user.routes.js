import { Router } from 'express'
import {
  getRoles,
  getUserById,
  getUsers,
  patchUserStatus,
  postUserRoles
} from '../controllers/user.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize } from '../middleware/rbac.middleware.js'

const router = Router()

router.use(authenticate)
router.use(authorize(['ADMIN']))

router.get('/users', getUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id/status', patchUserStatus)
router.post('/users/:id/roles', postUserRoles)
router.get('/roles', getRoles)

export default router
