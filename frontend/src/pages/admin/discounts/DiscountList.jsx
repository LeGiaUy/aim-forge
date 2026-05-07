import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminBrandApi,
  adminCategoryApi,
  adminDiscountApi,
  adminProductApi
} from '../../../services/adminApi.js'
import DiscountForm from './components/DiscountForm.jsx'
import DiscountPreview from './components/DiscountPreview.jsx'
import DiscountTable from './components/DiscountTable.jsx'
import FilterToolbar from './components/FilterToolbar.jsx'
import SelectedTargetsPanel from './components/SelectedTargetsPanel.jsx'

const EMPTY_FORM = {
  name: '',
  type: 'PERCENT',
  value: '',
  start_at: '',
  end_at: '',
  is_active: true,
  min_final_price: '1000',
  product_ids: [],
  variant_ids: []
}

const to_iso = value => {
  if (!value) return null
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return null
  return d.toISOString()
}

const to_date_time_local = value => {
  if (!value) return ''
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return ''
  const tz_offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz_offset).toISOString().slice(0, 16)
}

const dedupe_number_ids = list => [...new Set((list || []).map(Number).filter(Boolean))]

const useDebouncedValue = (value, delay_ms = 350) => {
  const [state, set_state] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => set_state(value), delay_ms)
    return () => clearTimeout(timer)
  }, [value, delay_ms])
  return state
}

export default function DiscountList() {
  const [discount_list, set_discount_list] = useState([])
  const [products, set_products] = useState([])
  const [brands, set_brands] = useState([])
  const [categories, set_categories] = useState([])
  const [variant_cache_map, set_variant_cache_map] = useState({})
  const [preview, set_preview] = useState(null)
  const [loading, set_loading] = useState(true)
  const [saving, set_saving] = useState(false)
  const [editing_id, set_editing_id] = useState(null)
  const [scope_mode, set_scope_mode] = useState('products')
  const [error_text, set_error_text] = useState('')
  const [list_params, set_list_params] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    product_id: '',
    brand_id: '',
    category_id: '',
    sort: 'newest'
  })
  const [pagination, set_pagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1
  })
  const [form, set_form] = useState(EMPTY_FORM)

  const debounced_search = useDebouncedValue(list_params.search, 350)

  const fetch_data = useCallback(async () => {
    try {
      set_loading(true)
      set_error_text('')
      const [discount_res, product_res, brand_res, category_res] =
        await Promise.all([
          adminDiscountApi.getAll({ ...list_params, search: debounced_search }),
          adminProductApi.getProducts({ page: 1, limit: 100 }),
          adminBrandApi.getAll(),
          adminCategoryApi.getAll()
        ])
      const discount_payload = discount_res.data?.data || {}
      set_discount_list(discount_payload.items || [])
      set_pagination(
        discount_payload.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 1
        }
      )
      set_products(product_res.data?.data?.items || [])
      set_brands(brand_res.data?.data || [])
      set_categories(category_res.data?.data || [])
    } catch (error) {
      set_error_text(error.message || 'Không tải được dữ liệu discount')
      set_discount_list([])
      set_products([])
    } finally {
      set_loading(false)
    }
  }, [list_params, debounced_search])

  useEffect(() => {
    fetch_data()
  }, [fetch_data])

  const ensure_variants_loaded = useCallback(
    async product_ids => {
      const ids_to_load = dedupe_number_ids(product_ids).filter(
        pid => !variant_cache_map[pid]
      )
      if (!ids_to_load.length) return
      const responses = await Promise.all(
        ids_to_load.map(pid => adminProductApi.getById(pid))
      )
      const next_entries = {}
      responses.forEach(response => {
        const product_data = response.data?.data
        if (!product_data?.product_id) return
        next_entries[product_data.product_id] = (product_data.variants || []).map(
          variant => ({
            variant_id: variant.variant_id,
            product_id: product_data.product_id,
            product_name: product_data.name,
            sku: variant.sku || `#${variant.variant_id}`,
            stock: Number(variant.stock || 0),
            price: Number(variant.sell_price || variant.final_price || 0),
            options_cache: variant.options_cache || {}
          })
        )
      })
      set_variant_cache_map(prev => ({ ...prev, ...next_entries }))
    },
    [variant_cache_map]
  )

  useEffect(() => {
    if (scope_mode !== 'variants') return
    const initial_product_ids = products.slice(0, 12).map(item => item.product_id)
    ensure_variants_loaded(initial_product_ids)
  }, [scope_mode, products, ensure_variants_loaded])

  const all_variants = useMemo(() => {
    return Object.values(variant_cache_map).flat()
  }, [variant_cache_map])

  const submit_payload = useMemo(
    () => ({
      name: form.name.trim(),
      type: form.type,
      value: Number(form.value),
      start_at: to_iso(form.start_at),
      end_at: form.end_at ? to_iso(form.end_at) : null,
      is_active: !!form.is_active,
      min_final_price: Number(form.min_final_price || 0),
      product_ids: form.product_ids.map(Number),
      variant_ids: form.variant_ids.map(Number)
    }),
    [form]
  )

  const reset_form = () => {
    set_form(EMPTY_FORM)
    set_editing_id(null)
    set_scope_mode('products')
    set_preview(null)
    set_error_text('')
  }

  const handle_submit = async event => {
    event.preventDefault()
    if (!form.name.trim()) {
      set_error_text('Tên chiến dịch không được để trống')
      return
    }
    try {
      set_saving(true)
      set_error_text('')
      if (editing_id) {
        await adminDiscountApi.update(editing_id, submit_payload)
      } else {
        await adminDiscountApi.create(submit_payload)
      }
      reset_form()
      fetch_data()
    } catch (error) {
      set_error_text(error.message || 'Không lưu được chương trình')
    } finally {
      set_saving(false)
    }
  }

  const handle_edit = async row => {
    set_editing_id(row.discount_id)
    set_scope_mode((row.variants || []).length > 0 ? 'variants' : 'products')
    set_form({
      name: row.name || '',
      type: row.type || 'PERCENT',
      value: String(row.value ?? ''),
      start_at: to_date_time_local(row.start_at),
      end_at: to_date_time_local(row.end_at),
      is_active: !!row.is_active,
      min_final_price: '1000',
      product_ids: (row.products || []).map(item => item.product_id),
      variant_ids: (row.variants || []).map(item => item.variant_id)
    })
    await ensure_variants_loaded(
      (row.products || []).map(item => item.product_id)
    )
  }

  const handle_delete = async discount_id => {
    if (!window.confirm('Xóa chương trình giảm giá này?')) return
    try {
      set_saving(true)
      await adminDiscountApi.delete(discount_id)
      fetch_data()
    } finally {
      set_saving(false)
    }
  }

  const handle_preview = async () => {
    try {
      set_saving(true)
      set_error_text('')
      const response = await adminDiscountApi.preview(submit_payload)
      set_preview(response.data?.data || null)
    } catch (error) {
      set_error_text(error.message || 'Không preview được chương trình')
      set_preview(null)
    } finally {
      set_saving(false)
    }
  }

  const apply_ids = (field_name, ids, toggle_single = false) => {
    const next_ids = dedupe_number_ids(ids)
    set_form(prev => {
      const current = new Set(prev[field_name] || [])
      if (toggle_single && next_ids.length === 1) {
        if (current.has(next_ids[0])) current.delete(next_ids[0])
        else current.add(next_ids[0])
      } else {
        next_ids.forEach(id => current.add(id))
      }
      return { ...prev, [field_name]: [...current] }
    })
  }

  const remove_ids = (field_name, ids) => {
    const blocked = new Set(dedupe_number_ids(ids))
    set_form(prev => ({
      ...prev,
      [field_name]: (prev[field_name] || []).filter(id => !blocked.has(id))
    }))
  }

  return (
    <div className='mx-auto max-w-[1400px] space-y-6 px-4 py-8'>
      <header className='space-y-1'>
        <h1 className='font-display text-2xl font-bold text-white'>
          Quản lý khuyến mãi
        </h1>
        <p className='text-sm text-[#64748b]'>
          Tối ưu tạo discount cho catalog lớn theo chuẩn ecommerce admin
        </p>
      </header>

      <FilterToolbar
        list_params={list_params}
        set_list_params={set_list_params}
        brands={brands}
        categories={categories}
        products={products}
      />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]'>
        <div className='space-y-6'>
          <DiscountForm
            editing_id={editing_id}
            form={form}
            set_form={set_form}
            scope_mode={scope_mode}
            set_scope_mode={set_scope_mode}
            products={products}
            brands={brands}
            categories={categories}
            variants={all_variants}
            on_preview={handle_preview}
            on_submit={handle_submit}
            saving={saving}
            on_reset={reset_form}
            on_bulk_select={apply_ids}
            on_bulk_clear={remove_ids}
          />
          {error_text ? (
            <div className='rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300'>
              {error_text}
            </div>
          ) : null}
          <DiscountPreview preview={preview} />
          <DiscountTable
            loading={loading}
            discount_list={discount_list}
            on_edit={handle_edit}
            on_delete={handle_delete}
          />
          <div className='flex items-center justify-center gap-2'>
            <button
              type='button'
              onClick={() =>
                set_list_params(prev => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1)
                }))
              }
              disabled={pagination.page <= 1}
              className='admin-btn-ghost text-xs disabled:opacity-40'
            >
              ← Trước
            </button>
            <span className='text-sm text-[#94a3b8]'>
              Trang {pagination.page}/{pagination.total_pages} - {pagination.total} mục
            </span>
            <button
              type='button'
              onClick={() =>
                set_list_params(prev => ({
                  ...prev,
                  page: Math.min(pagination.total_pages, prev.page + 1)
                }))
              }
              disabled={pagination.page >= pagination.total_pages}
              className='admin-btn-ghost text-xs disabled:opacity-40'
            >
              Sau →
            </button>
          </div>
        </div>

        <SelectedTargetsPanel
          products={products}
          variants={all_variants}
          selected_product_ids={form.product_ids}
          selected_variant_ids={form.variant_ids}
          on_remove_product={id => remove_ids('product_ids', [id])}
          on_remove_variant={id => remove_ids('variant_ids', [id])}
        />
      </div>
    </div>
  )
}
