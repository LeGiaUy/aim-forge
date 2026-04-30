import { prisma } from '../config/db.js'

const to_int = value => {
  const parsed_value = Number.parseInt(value, 10)
  return Number.isNaN(parsed_value) ? null : parsed_value
}

const to_role_name = user_role => user_role.role.role_name

const to_user_public = user_record => ({
  user_id: user_record.user_id,
  username: user_record.username,
  email: user_record.email,
  status: user_record.status,
  last_login: user_record.last_login,
  created_at: user_record.created_at,
  roles: user_record.roles.map(to_role_name)
})

export const get_users = async query_params => {
  const page = Math.max(to_int(query_params.page) || 1, 1)
  const limit = Math.max(to_int(query_params.limit) || 10, 1)
  const skip = (page - 1) * limit

  const where_clause = {}
  if (query_params.status) {
    where_clause.status = query_params.status
  }
  if (query_params.role) {
    where_clause.roles = {
      some: {
        role: {
          role_name: query_params.role
        }
      }
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where_clause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { roles: { include: { role: true } } }
    }),
    prisma.user.count({ where: where_clause })
  ])

  return {
    items: users.map(to_user_public),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(Math.ceil(total / limit), 1)
    }
  }
}

export const get_user_by_id = async user_id_value => {
  const user_id = to_int(user_id_value)
  if (!user_id) {
    const error = new Error('Invalid user id')
    error.status = 400
    throw error
  }

  const user_record = await prisma.user.findUnique({
    where: { user_id },
    include: {
      roles: { include: { role: true } },
      orders: {
        include: {
          payments: true,
          items: true
        },
        orderBy: { created_at: 'desc' }
      }
    }
  })

  if (!user_record) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  return {
    ...to_user_public(user_record),
    orders: user_record.orders
  }
}

export const update_user_status = async (target_user_id, actor_user_id, status) => {
  const next_status = String(status || '').toUpperCase()
  if (!['ACTIVE', 'INACTIVE', 'BANNED'].includes(next_status)) {
    const error = new Error('Invalid status')
    error.status = 400
    throw error
  }

  const target_id = to_int(target_user_id)
  const actor_id = to_int(actor_user_id)
  if (!target_id || !actor_id) {
    const error = new Error('Invalid user id')
    error.status = 400
    throw error
  }

  if (target_id === actor_id) {
    const error = new Error('Cannot change your own status')
    error.status = 400
    throw error
  }

  const target_user = await prisma.user.findUnique({
    where: { user_id: target_id },
    include: { roles: { include: { role: true } } }
  })
  if (!target_user) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  const has_admin_role = target_user.roles.some(user_role =>
    ['ADMIN', 'admin'].includes(user_role.role.role_name)
  )
  if (next_status === 'BANNED' && has_admin_role) {
    const error = new Error('Cannot ban ADMIN')
    error.status = 400
    throw error
  }

  const updated_user = await prisma.user.update({
    where: { user_id: target_id },
    data: { status: next_status },
    include: { roles: { include: { role: true } } }
  })

  return to_user_public(updated_user)
}

export const assign_roles = async (target_user_id, role_ids, actor_user_id) => {
  const target_id = to_int(target_user_id)
  const actor_id = to_int(actor_user_id)
  if (!target_id || !actor_id) {
    const error = new Error('Invalid user id')
    error.status = 400
    throw error
  }

  const normalized_role_ids = [...new Set((role_ids || []).map(to_int).filter(Boolean))]
  if (normalized_role_ids.length === 0) {
    const error = new Error('role_ids is required')
    error.status = 400
    throw error
  }

  const target_user = await prisma.user.findUnique({
    where: { user_id: target_id },
    include: { roles: true }
  })
  if (!target_user) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  const roles = await prisma.role.findMany({
    where: { role_id: { in: normalized_role_ids } }
  })
  if (roles.length !== normalized_role_ids.length) {
    const error = new Error('One or more roles not found')
    error.status = 400
    throw error
  }

  const existing_role_ids = new Set(
    target_user.roles.map(user_role => user_role.role_id)
  )
  const role_ids_to_create = normalized_role_ids.filter(
    role_id => !existing_role_ids.has(role_id)
  )

  if (role_ids_to_create.length > 0) {
    await prisma.userRole.createMany({
      data: role_ids_to_create.map(role_id => ({
        user_id: target_id,
        role_id
      })),
      skipDuplicates: true
    })
  }

  const updated_user = await prisma.user.findUnique({
    where: { user_id: target_id },
    include: { roles: { include: { role: true } } }
  })

  return to_user_public(updated_user)
}

export const get_roles = () =>
  prisma.role.findMany({
    orderBy: { role_name: 'asc' }
  })
