import { Router } from 'express'
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile
} from '../controllers/profile.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)
router.get('/', getMyProfile)
router.patch('/', updateMyProfile)
router.patch('/password', changeMyPassword)

export default router
