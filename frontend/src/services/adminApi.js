import api from './api.js'

export const adminProductApi = {
  getProducts(params = {}) {
    return api.get('/products', { params })
  },
  getById(id) {
    return api.get(`/products/${id}`)
  },
  create(payload) {
    return api.post('/products', payload)
  },
  update(id, payload) {
    return api.put(`/products/${id}`, payload, {
      timeout: 30000
    })
  },
  delete(id) {
    return api.delete(`/products/${id}`)
  }
}

export const adminAttributeApi = {
  getByCategory(category_id) {
    return api.get('/attributes', { params: { category_id } })
  },
  create(payload) {
    return api.post('/attributes', payload)
  },
  update(id, payload) {
    return api.put(`/attributes/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/attributes/${id}`)
  }
}

export const adminCategoryApi = {
  getAll() {
    return api.get('/categories')
  },
  create(payload) {
    return api.post('/categories', payload)
  },
  update(id, payload) {
    return api.put(`/categories/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/categories/${id}`)
  }
}

export const adminBrandApi = {
  getAll() {
    return api.get('/brands')
  },
  create(payload) {
    return api.post('/brands', payload)
  },
  update(id, payload) {
    return api.put(`/brands/${id}`, payload)
  },
  delete(id) {
    return api.delete(`/brands/${id}`)
  }
}
