import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../config/db.js'

const update_profile_schema = z.object({
  username: z.string().trim().min(1, 'Username is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  avatar: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable()
})

const change_password_schema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
})

const to_profile_response = user_record => ({
  user_id: user_record.user_id,
  username: user_record.username,
  email: user_record.email,
  avatar: user_record.avatar,
  phone: user_record.phone,
  address: user_record.address
})

export const get_my_profile = async user_id => {
  const user_record = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      username: true,
      email: true,
      avatar: true,
      phone: true,
      address: true
    }
  })

  if (!user_record) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  return to_profile_response(user_record)
}

export const update_my_profile = async (user_id, payload) => {
  const parsed_payload = update_profile_schema.safeParse(payload)
  if (!parsed_payload.success) {
    const error = new Error(
      parsed_payload.error.issues.map(issue => issue.message).join(', ')
    )
    error.status = 400
    throw error
  }

  const update_data = {}
  const { username, email, avatar, phone, address } = parsed_payload.data

  if (username !== undefined) {
    update_data.username = username
  }
  if (email !== undefined) {
    const duplicate_email = await prisma.user.findFirst({
      where: {
        email,
        NOT: { user_id }
      }
    })

    if (duplicate_email) {
      const error = new Error('Email already in use')
      error.status = 409
      throw error
    }

    update_data.email = email
  }
  if (avatar !== undefined) update_data.avatar = avatar || null
  if (phone !== undefined) update_data.phone = phone || null
  if (address !== undefined) update_data.address = address || null

  if (Object.keys(update_data).length === 0) {
    const error = new Error('No valid fields to update')
    error.status = 400
    throw error
  }

  try {
    const user_record = await prisma.user.update({
      where: { user_id },
      data: update_data,
      select: {
        user_id: true,
        username: true,
        email: true,
        avatar: true,
        phone: true,
        address: true
      }
    })

    return to_profile_response(user_record)
  } catch (error) {
    if (error.code === 'P2002') {
      const duplicate_error = new Error('Email or username already in use')
      duplicate_error.status = 409
      throw duplicate_error
    }
    throw error
  }
}

export const change_my_password = async (user_id, payload) => {
  const parsed_payload = change_password_schema.safeParse(payload)
  if (!parsed_payload.success) {
    const error = new Error(
      parsed_payload.error.issues.map(issue => issue.message).join(', ')
    )
    error.status = 400
    throw error
  }

  const { oldPassword, newPassword } = parsed_payload.data
  const user_record = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      password: true
    }
  })

  if (!user_record) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  const is_old_password_valid = await bcrypt.compare(
    oldPassword,
    user_record.password
  )
  if (!is_old_password_valid) {
    const error = new Error('Old password is incorrect')
    error.status = 400
    throw error
  }

  const new_password_hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { user_id },
    data: { password: new_password_hash }
  })
}
