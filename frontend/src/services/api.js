import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('aimforge_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize responses — always return data field
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aimforge_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const message =
      err.response?.data?.message || err.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

export const productApi = {
  getDetail(product_id) {
    return api.get(`/products/${product_id}`)
  },
  getByCategory(category_id) {
    return api.get('/products', { params: { category_id } })
  },
  addToCart(payload) {
    return api.post('/cart/add', payload)
  }
}

export const cartApi = {
  getCart() {
    return api.get('/cart')
  },
  addItem(payload) {
    return api.post('/cart/add', payload)
  },
  updateItem(payload) {
    return api.put('/cart/update', payload)
  },
  removeItem(variant_id) {
    return api.delete('/cart/remove', {
      data: { variant_id }
    })
  }
}

export const authApi = {
  login(payload) {
    return api.post('/auth/login', payload)
  },
  register(payload) {
    return api.post('/auth/register', payload)
  },
  getMe() {
    return api.get('/auth/me')
  }
}

export const orderApi = {
  createOrder(payload) {
    return api.post('/orders/create', payload)
  },
  getOrders(params = {}) {
    return api.get('/orders', { params })
  },
  getOrderById(order_id) {
    return api.get(`/orders/${order_id}`)
  }
}

export const profileApi = {
  getMe() {
    return api.get('/me')
  },
  updateMe(payload) {
    return api.patch('/me', payload)
  },
  changePassword(payload) {
    return api.patch('/me/password', payload)
  },
  uploadAvatar(form_data) {
    return api.post('/uploads/profile', form_data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    })
  }
}

export const paymentApi = {
  createVnpay(payload) {
    return api.post('/payments/create-vnpay', payload)
  },
  createCod(payload) {
    return api.post('/payments/create-cod', payload)
  },
  getVnpayReturn(params) {
    return api.get('/payments/vnpay-return', { params })
  }
}

export default api
