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

export default api
