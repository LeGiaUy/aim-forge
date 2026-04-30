import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  adminBrandApi,
  adminCategoryApi,
  adminProductApi
} from '../../../services/adminApi.js'
import { formatVnd } from '../../../utils/currency.js'

export default function ProductList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category_id: '', brand_id: '' })
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting_id, setDeletingId] = useState(null)

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: pagination.limit,
        ...(search.trim() && { search: search.trim() }),
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.brand_id && { brand_id: filters.brand_id })
      }
      const res = await adminProductApi.getProducts(params)
      const data = res.data.data
      setProducts(data.items || [])
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, total_pages: 1 })
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [search, filters, pagination.limit])

  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  useEffect(() => {
    Promise.all([adminCategoryApi.getAll(), adminBrandApi.getAll()])
      .then(([category_res, brand_res]) => {
        setCategories(category_res.data.data || [])
        setBrands(brand_res.data.data || [])
      })
      .catch(() => {
        setCategories([])
        setBrands([])
      })
  }, [])

  const handleDelete = async (product_id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      setDeletingId(product_id)
      await adminProductApi.delete(product_id)
      fetchProducts(pagination.page)
    } catch {
      alert('Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  const formatPrice = (price) => {
    if (price == null) return '—'
    return formatVnd(price)
  }

  const hasActiveDiscount = product_item => {
    if (
      product_item.discount_amount == null ||
      product_item.discount_amount <= 0
    ) {
      return false
    }
    if (
      product_item.final_price == null ||
      product_item.price == null
    ) {
      return false
    }
    return product_item.final_price < product_item.price
  }

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8'>
      {/* ─── Header ─── */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-2xl font-bold text-white'>Products</h1>
          <p className='text-sm text-[#64748b]'>{pagination.total} products total</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/create')}
          className='admin-btn-primary'
        >
          + New Product
        </button>
      </div>

      {/* ─── Filters ─── */}
      <div className='admin-card'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <div className='flex-1'>
            <label className='admin-label'>Search</label>
            <input
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search by name...'
              className='admin-input w-full'
            />
          </div>
          <div className='w-40'>
            <label className='admin-label'>Category</label>
            <select
              value={filters.category_id}
              onChange={e => setFilters(p => ({ ...p, category_id: e.target.value }))}
              className='admin-select w-full'
            >
              <option value=''>All</option>
              {categories.map(item => (
                <option key={item.category_id} value={item.category_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className='w-40'>
            <label className='admin-label'>Brand</label>
            <select
              value={filters.brand_id}
              onChange={e => setFilters(p => ({ ...p, brand_id: e.target.value }))}
              className='admin-select w-full'
            >
              <option value=''>All</option>
              {brands.map(item => (
                <option key={item.brand_id} value={item.brand_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className='overflow-x-auto rounded-xl border border-white/10 bg-[#0d0d1a]/80 backdrop-blur'>
        <table className='w-full text-sm'>
          <thead className='border-b border-white/10 bg-white/5'>
            <tr>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Product</th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Category</th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Brand</th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Price</th>
              <th className='px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Stock</th>
              <th className='px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/5'>
            {loading ? (
              <tr><td colSpan={6} className='px-5 py-12 text-center text-[#64748b]'>Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className='px-5 py-12 text-center text-[#64748b]'>No products found</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.product_id} className='transition hover:bg-white/[0.03]'>
                  <td className='px-5 py-4'>
                    <div className='flex items-center gap-3'>
                      {p.representative_variant?.main_image ? (
                        <img
                          src={p.representative_variant.main_image.image_url}
                          alt={p.name}
                          className='h-10 w-10 rounded-lg border border-white/10 object-cover'
                        />
                      ) : (
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] text-[#64748b]'>
                          N/A
                        </div>
                      )}
                      <Link to={`/admin/products/edit/${p.product_id}`} className='font-medium text-white transition hover:text-[#9f67ff]'>
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className='px-5 py-4 text-[#94a3b8]'>{p.category?.name || '—'}</td>
                  <td className='px-5 py-4 text-[#94a3b8]'>{p.brand?.name || '—'}</td>
                  <td className='px-5 py-4'>
                    {p.price != null ? (
                      hasActiveDiscount(p) ? (
                        <div className='space-y-0.5'>
                          <p className='text-xs text-[#64748b] line-through'>
                            {formatPrice(p.price)}
                          </p>
                          <p className='font-semibold text-emerald-400'>
                            {formatPrice(p.final_price)}
                          </p>
                          <p className='text-[11px] font-medium text-cyan-300'>
                            Save {formatPrice(Math.round(p.discount_amount))}
                          </p>
                        </div>
                      ) : (
                        <span className='text-emerald-400'>
                          {formatPrice(p.price)}
                        </span>
                      )
                    ) : (
                      <span className='text-[#64748b]'>—</span>
                    )}
                  </td>
                  <td className='px-5 py-4'>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.total_stock > 10
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : p.total_stock > 0
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                    }`}>
                      {p.total_stock ?? 0}
                    </span>
                  </td>
                  <td className='px-5 py-4'>
                    <div className='flex items-center justify-end gap-2'>
                      <button
                        onClick={() => navigate(`/admin/products/edit/${p.product_id}`)}
                        className='rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#94a3b8] transition hover:border-[#9f67ff]/50 hover:text-white'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.product_id)}
                        disabled={deleting_id === p.product_id}
                        className='rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20 disabled:opacity-40'
                      >
                        {deleting_id === p.product_id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      {pagination.total_pages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <button
            onClick={() => fetchProducts(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className='admin-btn-ghost text-xs disabled:opacity-30'
          >
            ← Prev
          </button>
          <span className='px-3 text-sm text-[#94a3b8]'>
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => fetchProducts(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages}
            className='admin-btn-ghost text-xs disabled:opacity-30'
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
