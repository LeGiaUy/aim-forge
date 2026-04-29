import { z } from 'zod'
import { prisma } from '../config/db.js'
import {
  buildVnpayPaymentUrl,
  verifyVnpaySecureHash
} from '../utils/vnpay.js'

const create_vnpay_schema = z.object({
  orderId: z.number().int().positive()
})

const create_cod_schema = z.object({
  orderId: z.number().int().positive()
})

const createHttpError = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}

const getOrderById = async order_id => {
  return prisma.order.findUnique({
    where: { order_id }
  })
}

const getPaymentByOrderAndMethod = async (order_id, method) => {
  return prisma.payment.findUnique({
    where: {
      order_id_method: {
        order_id,
        method
      }
    }
  })
}

export const createVnpayPayment = async (user_id, body, ip_address) => {
  const parsed_data = create_vnpay_schema.safeParse(body)
  if (!parsed_data.success) {
    throw createHttpError(
      parsed_data.error.issues.map(issue => issue.message).join(', '),
      400
    )
  }

  const order_id = parsed_data.data.orderId
  const order_data = await prisma.order.findFirst({
    where: {
      order_id,
      user_id
    }
  })

  if (!order_data) {
    throw createHttpError('Order not found', 404)
  }

  if (order_data.status === 'PAID' || order_data.is_paid) {
    throw createHttpError('Order already paid', 409)
  }

  const existed_payment = await getPaymentByOrderAndMethod(order_id, 'VNPAY')
  if (existed_payment?.status === 'SUCCESS') {
    throw createHttpError('Payment already successful', 409)
  }

  if (!process.env.VNP_TMNCODE || !process.env.VNP_HASHSECRET) {
    throw createHttpError('VNPAY config is missing', 500)
  }

  const payment_url = buildVnpayPaymentUrl({
    tmn_code: process.env.VNP_TMNCODE,
    hash_secret: process.env.VNP_HASHSECRET,
    vnp_url:
      process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    return_url: process.env.VNP_RETURNURL,
    order_id,
    amount_decimal: order_data.total,
    ip_address
  })

  const payment_data = {
    order_id,
    method: 'VNPAY',
    status: 'PENDING',
    amount: order_data.total,
    currency: 'VND'
  }

  if (!existed_payment) {
    await prisma.payment.create({
      data: payment_data
    })
  } else if (existed_payment.status !== 'SUCCESS') {
    await prisma.payment.update({
      where: {
        payment_id: existed_payment.payment_id
      },
      data: {
        status: 'PENDING',
        amount: order_data.total,
        response_code: null
      }
    })
  }

  return {
    order_id,
    payment_url
  }
}

export const handleVnpayReturn = async query_data => {
  const validation = verifyVnpaySecureHash(
    query_data,
    process.env.VNP_HASHSECRET || ''
  )

  return {
    is_valid_signature: validation.is_valid,
    order_id: Number(query_data.vnp_TxnRef),
    transaction_id: query_data.vnp_TransactionNo || null,
    response_code: query_data.vnp_ResponseCode || null,
    status:
      query_data.vnp_ResponseCode === '00' && validation.is_valid
        ? 'SUCCESS'
        : 'FAILED'
  }
}

export const handleVnpayIpn = async query_data => {
  const validation = verifyVnpaySecureHash(
    query_data,
    process.env.VNP_HASHSECRET || ''
  )
  if (!validation.is_valid) {
    return { RspCode: '97', Message: 'Invalid signature' }
  }

  const order_id = Number(query_data.vnp_TxnRef)
  const paid_amount_from_vnpay = Number(query_data.vnp_Amount) / 100
  const response_code = query_data.vnp_ResponseCode || '99'
  const transaction_id = query_data.vnp_TransactionNo || null

  const order_data = await getOrderById(order_id)
  if (!order_data) {
    return { RspCode: '01', Message: 'Order not found' }
  }

  const order_amount = Number(order_data.total)
  if (order_amount !== paid_amount_from_vnpay) {
    return { RspCode: '04', Message: 'Invalid amount' }
  }

  const payment_data = await getPaymentByOrderAndMethod(order_id, 'VNPAY')
  if (!payment_data) {
    return { RspCode: '01', Message: 'Payment not found' }
  }

  if (payment_data.status === 'SUCCESS' || order_data.is_paid) {
    return { RspCode: '02', Message: 'Order already confirmed' }
  }

  if (response_code === '00') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { payment_id: payment_data.payment_id },
        data: {
          status: 'SUCCESS',
          transaction_id,
          response_code,
          paid_at: new Date()
        }
      }),
      prisma.order.update({
        where: { order_id },
        data: {
          status: 'PAID',
          is_paid: true
        }
      })
    ])

    return { RspCode: '00', Message: 'Confirm success' }
  }

  await prisma.payment.update({
    where: { payment_id: payment_data.payment_id },
    data: {
      status: 'FAILED',
      transaction_id,
      response_code
    }
  })

  return { RspCode: '00', Message: 'Payment failed recorded' }
}

export const createCodPayment = async (user_id, body) => {
  const parsed_data = create_cod_schema.safeParse(body)
  if (!parsed_data.success) {
    throw createHttpError(
      parsed_data.error.issues.map(issue => issue.message).join(', '),
      400
    )
  }

  const order_id = parsed_data.data.orderId
  const order_data = await prisma.order.findFirst({
    where: {
      order_id,
      user_id
    }
  })
  if (!order_data) {
    throw createHttpError('Order not found', 404)
  }

  const existed_payment = await getPaymentByOrderAndMethod(order_id, 'COD')
  if (existed_payment) {
    return existed_payment
  }

  return prisma.payment.create({
    data: {
      order_id,
      method: 'COD',
      status: 'PENDING',
      amount: order_data.total,
      currency: 'VND'
    }
  })
}

export const confirmCodDelivery = async order_id => {
  const order_data = await getOrderById(Number(order_id))
  if (!order_data) {
    throw createHttpError('Order not found', 404)
  }

  const payment_data = await getPaymentByOrderAndMethod(
    Number(order_id),
    'COD'
  )
  if (!payment_data) {
    throw createHttpError('COD payment not found', 404)
  }

  if (payment_data.status === 'SUCCESS') {
    return payment_data
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { payment_id: payment_data.payment_id },
      data: {
        status: 'SUCCESS',
        paid_at: new Date(),
        response_code: 'COD_CONFIRMED'
      }
    }),
    prisma.order.update({
      where: { order_id: Number(order_id) },
      data: {
        status: 'COMPLETED',
        is_paid: true
      }
    })
  ])

  return prisma.payment.findUnique({
    where: { payment_id: payment_data.payment_id }
  })
}
