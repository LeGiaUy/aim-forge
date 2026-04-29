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
  },
  uploadImages(form_data) {
    return api.post('/uploads/products', form_data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    })
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
  },
  uploadImages(form_data) {
    return api.post('/uploads/categories', form_data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    })
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
  },
  uploadImages(form_data) {
    return api.post('/uploads/brands', form_data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    })
  }
}

export const adminOrderApi = {
  getOrders(params = {}) {
    return api.get('/admin/orders', { params })
  },
  getById(order_id) {
    return api.get(`/admin/orders/${order_id}`)
  },
  updateStatus(order_id, new_status) {
    return api.patch(`/admin/orders/${order_id}/status`, {
      newStatus: new_status
    })
  }
}
