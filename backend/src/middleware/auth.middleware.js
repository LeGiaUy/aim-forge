import jwt from 'jsonwebtoken'
import { prisma } from '../config/db.js'
import { sendError } from '../utils/response.js'

export const authenticate = async (req, res, next) => {
  try {
    const auth_header = req.headers.authorization
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
      return sendError(res, 'Unauthorized - no token provided', 401)
    }

    const token = auth_header.split(' ')[1]
    const decoded_token = jwt.verify(token, process.env.JWT_SECRET)

    const user_record = await prisma.user.findUnique({
      where: { user_id: decoded_token.user_id },
      select: {
        user_id: true,
        username: true,
        email: true,
        avatar: true,
        phone: true,
        address: true,
        status: true,
        last_login: true,
        created_at: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user_record) {
      return sendError(res, 'Unauthorized - user not found', 401)
    }

    req.user = user_record
    return next()
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return sendError(res, 'Unauthorized - invalid or expired token', 401)
    }
    return next(error)
  }
}
