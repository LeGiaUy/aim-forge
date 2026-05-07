import { prisma } from '../config/db.js'

const createHttpError = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}

const parseDateRange = (start_date, end_date) => {
  if (!start_date && !end_date) {
    return undefined
  }

  const range_filter = {}

  if (start_date) {
    const parsed_start_date = new Date(start_date)
    if (Number.isNaN(parsed_start_date.getTime())) {
      throw createHttpError('Invalid start_date', 400)
    }
    range_filter.gte = parsed_start_date
  }

  if (end_date) {
    const parsed_end_date = new Date(end_date)
    if (Number.isNaN(parsed_end_date.getTime())) {
      throw createHttpError('Invalid end_date', 400)
    }
    range_filter.lte = parsed_end_date
  }

  return range_filter
}

const getLatestPayment = order_data => {
  if (!order_data.payments || order_data.payments.length === 0) {
    return null
  }
  return order_data.payments[0]
}

const getAllowedTransitions = (current_status, payment_method) => {
  if (current_status === 'PENDING') {
    return ['PROCESSING', 'CANCELLED']
  }

  if (current_status === 'PAID') {
    return ['PROCESSING', 'CANCELLED']
  }

  if (current_status === 'PROCESSING') {
    return ['SHIPPED']
  }

  if (current_status === 'SHIPPED') {
    return ['COMPLETED']
  }

  return []
}

const admin_variant_include = {
  product: true,
  variant_option_values: {
    include: {
      option_value: { include: { option: true } }
    }
  }
}

const reduceStockAtProcessing = async (tx, items_data) => {
  for (const item_data of items_data) {
    const update_result = await tx.productVariant.updateMany({
      where: {
        variant_id: item_data.variant_id,
        stock: {
          gte: item_data.quantity
        }
      },
      data: {
        stock: {
          decrement: item_data.quantity
        }
      }
    })

    if (update_result.count === 0) {
      throw createHttpError(
        `Insufficient stock for variant ${item_data.variant_id}`,
        409
      )
    }
  }
}

export const getAdminOrders = async query_data => {
  const page_number = Math.max(Number(query_data.page) || 1, 1)
  const page_size = Math.min(Math.max(Number(query_data.limit) || 10, 1), 100)
  const status_value = query_data.status || undefined
  const date_range = parseDateRange(
    query_data.start_date,
    query_data.end_date
  )

  const where_filter = {}
  if (status_value) {
    where_filter.status = status_value
  }
  if (date_range) {
    where_filter.created_at = date_range
  }

  const [total_records, orders_data] = await Promise.all([
    prisma.order.count({
      where: where_filter
    }),
    prisma.order.findMany({
      where: where_filter,
      include: {
        user: true,
        items: {
          include: {
            variant: {
              include: admin_variant_include
            }
          }
        },
        payments: {
          orderBy: {
            created_at: 'desc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: (page_number - 1) * page_size,
      take: page_size
    })
  ])

  return {
    page: page_number,
    limit: page_size,
    total: total_records,
    total_pages: Math.ceil(total_records / page_size),
    items: orders_data
  }
}

export const getAdminOrderById = async order_id => {
  const order_data = await prisma.order.findUnique({
    where: {
      order_id: Number(order_id)
    },
    include: {
      user: true,
      items: {
        include: {
          variant: {
            include: admin_variant_include
          }
        }
      },
      payments: {
        orderBy: {
          created_at: 'desc'
        }
      }
    }
  })

  if (!order_data) {
    throw createHttpError('Order not found', 404)
  }

  return order_data
}

export const updateOrderStatus = async (order_id, new_status) => {
  if (!new_status) {
    throw createHttpError('newStatus is required', 400)
  }

  if (new_status === 'FAILED') {
    throw createHttpError('FAILED status is system-managed only', 400)
  }

  if (new_status === 'PAID') {
    throw createHttpError('PAID status cannot be set by admin', 400)
  }

  const order_data = await prisma.order.findUnique({
    where: {
      order_id: Number(order_id)
    },
    include: {
      items: true,
      payments: {
        orderBy: {
          created_at: 'desc'
        }
      }
    }
  })

  if (!order_data) {
    throw createHttpError('Order not found', 404)
  }

  const current_status = order_data.status
  const latest_payment = getLatestPayment(order_data)
  const payment_method = latest_payment?.method

  if (current_status === new_status) {
    throw createHttpError('Order already at this status', 409)
  }

  if (current_status === 'COMPLETED' || current_status === 'CANCELLED') {
    throw createHttpError(
      'Completed or cancelled orders cannot be modified',
      409
    )
  }

  if (payment_method === 'VNPAY' && new_status === 'PAID') {
    throw createHttpError('VNPAY orders are paid by IPN only', 400)
  }

  const allowed_transitions = getAllowedTransitions(current_status, payment_method)
  if (!allowed_transitions.includes(new_status)) {
    throw createHttpError(
      `Invalid transition from ${current_status} to ${new_status}`,
      400
    )
  }

  await prisma.$transaction(async tx => {
    if (new_status === 'PROCESSING') {
      await reduceStockAtProcessing(tx, order_data.items)
    }

    const update_result = await tx.order.updateMany({
      where: {
        order_id: Number(order_id),
        status: current_status
      },
      data: {
        status: new_status
      }
    })

    if (update_result.count === 0) {
      throw createHttpError('Order status conflict detected', 409)
    }

    if (
      latest_payment &&
      latest_payment.method === 'COD' &&
      new_status === 'COMPLETED'
    ) {
      await tx.payment.update({
        where: {
          payment_id: latest_payment.payment_id
        },
        data: {
          status: 'SUCCESS',
          paid_at: new Date()
        }
      })
    }

    if (latest_payment && current_status === 'PAID' && new_status === 'CANCELLED') {
      await tx.payment.update({
        where: {
          payment_id: latest_payment.payment_id
        },
        data: {
          status: 'FAILED'
        }
      })
    }
  })

  return getAdminOrderById(order_id)
}
