import crypto from 'crypto'

const sortObjectByKey = data_object => {
  const sorted_keys = Object.keys(data_object).sort()
  const sorted_object = {}

  for (const key of sorted_keys) {
    sorted_object[key] = data_object[key]
  }

  return sorted_object
}

const toVnpayQuery = data_object => {
  const sorted_object = sortObjectByKey(data_object)
  const query = new URLSearchParams()

  for (const key of Object.keys(sorted_object)) {
    const value = sorted_object[key]
    if (value === undefined || value === null || value === '') {
      continue
    }
    query.append(key, String(value))
  }

  return query.toString()
}

export const createVnpaySecureHash = (data_object, hash_secret) => {
  const sign_data = toVnpayQuery(data_object)
  return crypto
    .createHmac('sha512', hash_secret)
    .update(Buffer.from(sign_data, 'utf-8'))
    .digest('hex')
}

export const buildVnpayPaymentUrl = ({
  tmn_code,
  hash_secret,
  vnp_url,
  return_url,
  order_id,
  amount_decimal,
  ip_address
}) => {
  const now_date = new Date()
  const date_formatter = value => String(value).padStart(2, '0')
  const vnp_create_date = `${now_date.getFullYear()}${date_formatter(
    now_date.getMonth() + 1
  )}${date_formatter(now_date.getDate())}${date_formatter(
    now_date.getHours()
  )}${date_formatter(now_date.getMinutes())}${date_formatter(
    now_date.getSeconds()
  )}`

  const vnp_amount = Math.round(Number(amount_decimal) * 100)
  const payload = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmn_code,
    vnp_Amount: vnp_amount,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: `${order_id}`,
    vnp_OrderInfo: `Thanh toan don hang ${order_id}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: return_url,
    vnp_IpAddr: ip_address || '127.0.0.1',
    vnp_CreateDate: vnp_create_date
  }

  const vnp_secure_hash = createVnpaySecureHash(payload, hash_secret)
  const query = toVnpayQuery({
    ...payload,
    vnp_SecureHash: vnp_secure_hash
  })

  return `${vnp_url}?${query}`
}

export const verifyVnpaySecureHash = (query_params, hash_secret) => {
  const input_data = { ...query_params }
  const received_hash = input_data.vnp_SecureHash

  delete input_data.vnp_SecureHash
  delete input_data.vnp_SecureHashType

  const calculated_hash = createVnpaySecureHash(input_data, hash_secret)

  return {
    is_valid: received_hash === calculated_hash,
    received_hash,
    calculated_hash
  }
}
