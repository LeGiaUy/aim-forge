import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/db.js'

const register_schema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6)
})

const login_schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const ROLE_USER_CANDIDATES = ['USER', 'user']

const format_validation_error = zod_error =>
  zod_error.issues.map(issue => issue.message).join(', ')

const to_public_user = user_record => ({
  user_id: user_record.user_id,
  username: user_record.username,
  email: user_record.email,
  status: user_record.status,
  last_login: user_record.last_login,
  created_at: user_record.created_at
})

const normalize_role_names = role_links =>
  role_links.map(role_link => role_link.role.role_name)

const sign_token = (user_record, role_names) =>
  jwt.sign(
    {
      user_id: user_record.user_id,
      email: user_record.email,
      roles: role_names
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

const get_default_user_role = async () => {
  const existing_role = await prisma.role.findFirst({
    where: { role_name: { in: ROLE_USER_CANDIDATES } }
  })

  if (existing_role) {
    return existing_role
  }

  return prisma.role.create({ data: { role_name: 'USER' } })
}

export const register = async payload => {
  const parsed_payload = register_schema.safeParse(payload)
  if (!parsed_payload.success) {
    const error = new Error(
      format_validation_error(parsed_payload.error)
    )
    error.status = 400
    throw error
  }

  const { username, email, password } = parsed_payload.data
  const duplicate_user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }]
    }
  })

  if (duplicate_user) {
    const error = new Error('Email or username already in use')
    error.status = 409
    throw error
  }

  const user_role = await get_default_user_role()
  const password_hash = await bcrypt.hash(password, 12)

  const created_user = await prisma.user.create({
    data: {
      username,
      email,
      password: password_hash,
      status: 'ACTIVE',
      roles: {
        create: [{ role_id: user_role.role_id }]
      }
    },
    include: {
      roles: { include: { role: true } }
    }
  })

  const role_names = normalize_role_names(created_user.roles)
  const token = sign_token(created_user, role_names)

  return {
    user: {
      ...to_public_user(created_user),
      roles: role_names
    },
    token
  }
}

export const login = async payload => {
  const parsed_payload = login_schema.safeParse(payload)
  if (!parsed_payload.success) {
    const error = new Error(
      format_validation_error(parsed_payload.error)
    )
    error.status = 400
    throw error
  }

  const { email, password } = parsed_payload.data
  const user_record = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } }
            }
          }
        }
      }
    }
  })

  if (!user_record) {
    const error = new Error('Invalid email or password')
    error.status = 401
    throw error
  }

  const is_password_valid = await bcrypt.compare(
    password,
    user_record.password
  )
  if (!is_password_valid) {
    const error = new Error('Invalid email or password')
    error.status = 401
    throw error
  }

  if (user_record.status === 'BANNED') {
    const error = new Error('Account has been banned')
    error.status = 403
    throw error
  }

  const updated_user = await prisma.user.update({
    where: { user_id: user_record.user_id },
    data: { last_login: new Date() },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } }
            }
          }
        }
      }
    }
  })

  const role_names = normalize_role_names(updated_user.roles)
  const token = sign_token(updated_user, role_names)

  return {
    user: {
      ...to_public_user(updated_user),
      roles: role_names
    },
    token
  }
}

export const get_me = async user_id => {
  const user_record = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      username: true,
      email: true,
      status: true,
      last_login: true,
      created_at: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  })

  if (!user_record) {
    return null
  }

  return {
    user_id: user_record.user_id,
    username: user_record.username,
    email: user_record.email,
    status: user_record.status,
    last_login: user_record.last_login,
    created_at: user_record.created_at,
    roles: user_record.roles.map(role_link => role_link.role.role_name),
    permissions: [...new Set(
      user_record.roles.flatMap(role_link =>
        role_link.role.permissions.map(
          role_permission => role_permission.permission.permission_name
        )
      )
    )]
  }
}
