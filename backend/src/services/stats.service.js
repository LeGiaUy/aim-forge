import { prisma } from '../config/db.js'

const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
}

const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS'
}

const parseDateValue = (input_value, field_name) => {
  if (!input_value) {
    return null
  }

  const parsed_date = new Date(input_value)
  if (Number.isNaN(parsed_date.getTime())) {
    const error = new Error(`Invalid ${field_name}`)
    error.status = 400
    throw error
  }

  return parsed_date
}

const parseDateRange = query_data => {
  const from_date = parseDateValue(query_data.from, 'from')
  const to_date = parseDateValue(query_data.to, 'to')

  if (!from_date && !to_date) {
    return null
  }

  if (from_date && to_date && from_date > to_date) {
    const error = new Error('from must be less than or equal to to')
    error.status = 400
    throw error
  }

  const date_filter = {}

  if (from_date) {
    date_filter.gte = from_date
  }

  if (to_date) {
    date_filter.lte = to_date
  }

  return date_filter
}

const buildOrderDateWhere = date_filter => {
  if (!date_filter) {
    return {}
  }

  return {
    created_at: date_filter
  }
}

const safePercent = (numerator_value, denominator_value) => {
  if (!denominator_value) {
    return 0
  }

  return Number(((numerator_value / denominator_value) * 100).toFixed(2))
}

const safeDecimalToNumber = decimal_value => {
  if (!decimal_value) {
    return 0
  }

  return Number(decimal_value)
}

const getCompletedRevenueFilter = date_filter => ({
  ...buildOrderDateWhere(date_filter),
  status: ORDER_STATUS.COMPLETED,
  payments: {
    some: {
      status: PAYMENT_STATUS.SUCCESS
    }
  }
})

const getOrderStatusCount = async (status_value, date_filter) => {
  return prisma.order.count({
    where: {
      ...buildOrderDateWhere(date_filter),
      status: status_value
    }
  })
}

export const getKpiStats = async query_data => {
  const date_filter = parseDateRange(query_data)

  const order_filter = buildOrderDateWhere(date_filter)
  const revenue_filter = getCompletedRevenueFilter(date_filter)

  const [
    total_orders,
    completed_orders,
    cancelled_orders,
    revenue_aggregate
  ] = await Promise.all([
    prisma.order.count({
      where: order_filter
    }),
    prisma.order.count({
      where: {
        ...order_filter,
        status: ORDER_STATUS.COMPLETED
      }
    }),
    prisma.order.count({
      where: {
        ...order_filter,
        status: ORDER_STATUS.CANCELLED
      }
    }),
    prisma.order.aggregate({
      where: revenue_filter,
      _sum: {
        total: true
      }
    })
  ])

  const revenue_value = safeDecimalToNumber(revenue_aggregate._sum.total)
  const cancel_rate = safePercent(cancelled_orders, total_orders)
  const conversion_rate = safePercent(completed_orders, total_orders)
  const aov_value = completed_orders
    ? Number((revenue_value / completed_orders).toFixed(2))
    : 0

  return {
    revenue: revenue_value,
    totalOrders: total_orders,
    completedOrders: completed_orders,
    cancelRate: cancel_rate,
    conversionRate: conversion_rate,
    aov: aov_value
  }
}

export const getRevenueChart = async query_data => {
  const date_filter = parseDateRange(query_data)
  const group_by = query_data.groupBy || 'day'

  if (!['day', 'month'].includes(group_by)) {
    const error = new Error('groupBy must be day or month')
    error.status = 400
    throw error
  }

  const orders_data = await prisma.order.findMany({
    where: getCompletedRevenueFilter(date_filter),
    select: {
      created_at: true,
      total: true
    },
    orderBy: {
      created_at: 'asc'
    }
  })

  const grouped_revenue = new Map()

  for (const order_data of orders_data) {
    const order_date = new Date(order_data.created_at)
    const year_value = order_date.getUTCFullYear()
    const month_value = `${order_date.getUTCMonth() + 1}`.padStart(2, '0')
    const day_value = `${order_date.getUTCDate()}`.padStart(2, '0')

    const bucket_key =
      group_by === 'month'
        ? `${year_value}-${month_value}`
        : `${year_value}-${month_value}-${day_value}`

    const previous_value = grouped_revenue.get(bucket_key) || 0
    grouped_revenue.set(
      bucket_key,
      previous_value + safeDecimalToNumber(order_data.total)
    )
  }

  return Array.from(grouped_revenue.entries()).map(([date, revenue]) => ({
    date,
    revenue: Number(revenue.toFixed(2))
  }))
}

export const getOrderStatusDistribution = async query_data => {
  const date_filter = parseDateRange(query_data)

  const [pending_value, paid_value, completed_value, cancelled_value] =
    await Promise.all([
      getOrderStatusCount(ORDER_STATUS.PENDING, date_filter),
      getOrderStatusCount(ORDER_STATUS.PAID, date_filter),
      getOrderStatusCount(ORDER_STATUS.COMPLETED, date_filter),
      getOrderStatusCount(ORDER_STATUS.CANCELLED, date_filter)
    ])

  return [
    { status: ORDER_STATUS.PENDING, count: pending_value },
    { status: ORDER_STATUS.PAID, count: paid_value },
    { status: ORDER_STATUS.COMPLETED, count: completed_value },
    { status: ORDER_STATUS.CANCELLED, count: cancelled_value }
  ]
}

export const getTopProducts = async query_data => {
  const date_filter = parseDateRange(query_data)

  const grouped_items = await prisma.orderItem.groupBy({
    by: ['variant_id'],
    where: {
      order: {
        ...buildOrderDateWhere(date_filter),
        status: ORDER_STATUS.COMPLETED
      }
    },
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 10
  })

  if (grouped_items.length === 0) {
    return []
  }

  const variant_id_list = grouped_items.map(item_data => item_data.variant_id)

  const variant_list = await prisma.productVariant.findMany({
    where: {
      variant_id: {
        in: variant_id_list
      }
    },
    include: {
      product: {
        select: {
          name: true
        }
      }
    }
  })

  const variant_map = new Map(
    variant_list.map(variant_data => [variant_data.variant_id, variant_data])
  )

  return grouped_items.map(item_data => {
    const variant_data = variant_map.get(item_data.variant_id)
    return {
      variantId: item_data.variant_id,
      productName: variant_data?.product?.name || `Variant ${item_data.variant_id}`,
      quantity: item_data._sum.quantity || 0
    }
  })
}

export const getPaymentMethodStats = async query_data => {
  const date_filter = parseDateRange(query_data)

  const where_filter = {}
  if (date_filter) {
    where_filter.created_at = date_filter
  }

  const grouped_payments = await prisma.payment.groupBy({
    by: ['method'],
    where: where_filter,
    _count: {
      _all: true
    },
    orderBy: {
      _count: {
        method: 'desc'
      }
    }
  })

  return grouped_payments.map(payment_data => ({
    method: payment_data.method,
    count: payment_data._count._all
  }))
}

export const getFunnelStats = async query_data => {
  const date_filter = parseDateRange(query_data)
  const order_filter = buildOrderDateWhere(date_filter)

  const [created_count, paid_count, completed_count] = await Promise.all([
    prisma.order.count({
      where: order_filter
    }),
    prisma.order.count({
      where: {
        ...order_filter,
        payments: {
          some: {
            status: PAYMENT_STATUS.SUCCESS
          }
        }
      }
    }),
    prisma.order.count({
      where: {
        ...order_filter,
        status: ORDER_STATUS.COMPLETED
      }
    })
  ])

  return {
    created: created_count,
    paid: paid_count,
    completed: completed_count,
    conversion: {
      createdToPaid: safePercent(paid_count, created_count),
      paidToCompleted: safePercent(completed_count, paid_count)
    }
  }
}
