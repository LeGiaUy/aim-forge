import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import AdminAutosizeTextarea from '../../../components/admin/AdminAutosizeTextarea.jsx'
import ChipOptionAxesEditor from '../../../components/admin/create/ChipOptionAxesEditor.jsx'
import CreateVariantMatrixPanel from '../../../components/admin/create/CreateVariantMatrixPanel.jsx'
import { useProductForm } from '../../../hooks/useProductForm.js'
import { adminProductApi } from '../../../services/adminApi.js'
import {
  axes_to_product_options,
  regenerate_variants_matrix,
} from '../../../utils/variantMatrixHelpers.js'

const default_axes_snapshot = [
  { name: 'Màu', values: ['Mặc định'], value_images: {} },
]

/** Dọn value_images khi xoá / đổi nhãn chip (trục gallery) */
function prune_axes_value_images(ax_list_in) {
  const ax0 = ax_list_in[0]
  if (!ax0?.value_images) return ax_list_in;
  const allowed = new Set(
    (ax0.values || []).map(v => String(v).trim()).filter(Boolean)
  )
  const next_map = {}
  for (const key of Object.keys(ax0.value_images)) {
    if (allowed.has(key)) next_map[key] = ax0.value_images[key];
  }
  if (Object.keys(next_map).length === Object.keys(ax0.value_images).length &&
    Object.keys(next_map).every(k => ax0.value_images[k] === next_map[k])) {
    return ax_list_in
  }
  return ax_list_in.map((a, i) =>
    i === 0 ? { ...a, value_images: next_map } : a
  )
}

export default function ProductCreate() {
  const navigate = useNavigate()
  const {
    form,
    categories,
    brands,
    attributes,
    specs,
    product_options,
    variants,
    loading,
    error,
    setLoading,
    setError,
    handleFormChange,
    handleSpecChange,
    replace_create_product_options,
    replace_create_variants,
    assembleCreatePayloadFromSynced,
  } = useProductForm()

  const [axes, set_axes] = useState(() => [...default_axes_snapshot])
  const [matrix_sku_prefix, set_matrix_sku_prefix] = useState('')
  const matrix_sku_prefix_ref = useRef(matrix_sku_prefix)
  matrix_sku_prefix_ref.current = matrix_sku_prefix

  const last_cat_for_axes_reset = useRef('')

  /** Đổi danh mục → reset chip mặc định (không đọc product_options cũ, tránh clash với hook) */
  useEffect(() => {
    const cid = form.category_id ? String(form.category_id) : ''
    if (!cid) {
      last_cat_for_axes_reset.current = ''
      return
    }
    if (last_cat_for_axes_reset.current === cid) return
    last_cat_for_axes_reset.current = cid
    set_axes(
      prune_axes_value_images([
        ...default_axes_snapshot.map(a => ({
          ...a,
          values: [...a.values],
          value_images: { ...a.value_images },
        }))
      ])
    )
  }, [form.category_id])

  /** Cartesian + sync product_options và variants trong create */
  useEffect(() => {
    const snapshot_old_po = product_options

    replace_create_variants(prev_v =>
      regenerate_variants_matrix({
        axes,
        prev_product_options: snapshot_old_po,
        prev_variants: prev_v,
        default_price: form.price,
        sku_prefix: matrix_sku_prefix_ref.current.trim(),
      })
    )
    replace_create_product_options(axes_to_product_options(axes))
    // Không thêm product_options vào deps (effect này vừa set nó → loop).
  }, [
    axes,
    form.price,
    form.category_id,
    replace_create_product_options,
    replace_create_variants,
  ])

  const handle_add_axis_row = useCallback(() => {
    set_axes(ax_list_in => [
      ...ax_list_in,
      {
        name: `Tuỳ chọn ${ax_list_in.length + 1}`,
        values: [],
      },
    ])
  }, [])

  const handle_remove_axis_row = useCallback(axis_index_click => {
    set_axes(ax_list_in =>
      ax_list_in.length <= 1 ?
        ax_list_in
      : ax_list_in.filter((_axis_item, filter_i) => filter_i !== axis_index_click)
    )
  }, [])

  /** Đặt axes + dọn ảnh trục 0 khỏi nhãn đã xóa */
  const handle_axes_change_stable = useCallback(ax_list_next => {
    set_axes(prune_axes_value_images(ax_list_next))
  }, [])

  /** Upload ảnh gallery (CDN) → URL */
  const handle_gallery_upload = useCallback(async file_list_in => {
    const form_blob = new FormData()
    file_list_in.forEach(f => form_blob.append('images', f))
    const res = await adminProductApi.uploadImages(form_blob)
    return res.data.data?.image_urls ?? []
  }, [])

  const patch_variant_fields = useCallback(
    updater => {
      replace_create_variants(updater)
    },
    [replace_create_variants]
  )

  const spec_attributes = attributes

  const nonempty_money_ok = raw => {
    const s = String(raw ?? '').trim()
    if (!s) return false
    const n = Number(s)
    return Number.isFinite(n) && !Number.isNaN(n) && n >= 0
  }

  const optional_money_ok = raw => {
    const s = String(raw ?? '').trim()
    if (!s) return true
    const n = Number(s)
    return Number.isFinite(n) && n >= 0
  }

  const handle_submit = async e => {
    e.preventDefault()
    setError('')

    if (!form.name?.trim() || !form.category_id || !form.brand_id) {
      setError('Vui lòng nhập tên, danh mục và thương hiệu.')
      return
    }
    if (form.price !== '' && !optional_money_ok(form.price)) {
      setError('Giá listing không hợp lệ (số ≥ 0 hoặc để trống).')
      return
    }
    const po_ready = axes_to_product_options(axes)
    for (const opt of po_ready) {
      if (!opt.name?.trim()) {
        setError('Nhập tên cho mỗi trục tùy chọn.')
        return
      }
      if (!opt.values.length) {
        setError(`Trục "${opt.name.trim()}" cần ít nhất một giá trị chip.`)
        return
      }
      for (const val of opt.values) {
        if (!String(val.value ?? '').trim()) {
          setError(`Giá trị trống tại "${opt.name.trim()}".`)
          return
        }
      }
    }
    if (!variants.length) {
      setError('Chưa sinh được biến thể — kiểm tra từng trục có giá trị.')
      return
    }
    const opt_axes_count = po_ready.length
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if ((v.option_selections || []).length !== opt_axes_count) {
        setError('Biến thể không khớp số trục.')
        return
      }
      if (!nonempty_money_ok(v.price)) {
        setError(`Biến thể ${i + 1}: nhập giá bán (≥ 0).`)
        return
      }
      if (
        !optional_money_ok(v.compare_price) ||
        !optional_money_ok(v.cost_price)
      ) {
        setError(
          `Biến thể ${i + 1}: giá niêm / vốn không hợp lệ hoặc âm.`
        )
        return
      }
    }

    try {
      setLoading(true)
      const snapshot_prev_po = product_options
      const synced_po = axes_to_product_options(axes)
      const synced_va = regenerate_variants_matrix({
        axes,
        prev_product_options: snapshot_prev_po,
        prev_variants: variants,
        default_price: form.price,
        sku_prefix: matrix_sku_prefix.trim(),
      })
      flushSync(() => {
        replace_create_product_options(synced_po)
        replace_create_variants(synced_va)
      })
      /** Không gọi buildPayload() sau flushSync — closure còn state cũ */
      const payload = assembleCreatePayloadFromSynced(synced_po, synced_va)
      await adminProductApi.create(payload)
      navigate('/admin/products')
    } catch (err) {
      setError(err.message || 'Không tạo được sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto max-w-6xl space-y-8 px-4 py-8'>
      <div>
        <button
          type='button'
          onClick={() => navigate('/admin/products')}
          className='mb-2 text-sm text-[#64748b] transition hover:text-[#9f67ff]'
        >
          ← Về danh sách sản phẩm
        </button>
        <h1 className='font-display text-2xl font-bold text-white'>
          Tạo sản phẩm mới
        </h1>
      </div>

      <form onSubmit={handle_submit} className='space-y-8'>
        {/* ─── Basic ─── */}
        <section className='admin-card'>
          <h2 className='admin-section-title'>Thông tin cơ bản</h2>
          <div className='space-y-4'>
            <div>
              <label className='admin-label'>Tên sản phẩm *</label>
              <input
                type='text'
                value={form.name}
                onChange={e => handleFormChange('name', e.target.value)}
                className='admin-input w-full'
                placeholder='vd. Lamzu Maya X 8K'
              />
            </div>
            <div>
              <label className='admin-label'>Giá listing (₫)</label>
              <p className='mb-1.5 text-xs text-[#64748b]'>
                Đồng thời dùng làm giá bán gợi ý cho các biến thể mới được sinh ra.
              </p>
              <input
                type='number'
                min='0'
                step='1'
                value={form.price}
                onChange={e => handleFormChange('price', e.target.value)}
                className='admin-input w-full max-w-md'
                placeholder='vd. 1590000 — có thể để trống'
              />
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='admin-label'>Danh mục *</label>
                <select
                  value={form.category_id}
                  onChange={e => handleFormChange('category_id', e.target.value)}
                  className='admin-select w-full'
                >
                  <option value=''>Chọn danh mục…</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='admin-label'>Thương hiệu *</label>
                <select
                  value={form.brand_id}
                  onChange={e => handleFormChange('brand_id', e.target.value)}
                  className='admin-select w-full'
                >
                  <option value=''>Chọn thương hiệu…</option>
                  {brands.map(b => (
                    <option key={b.brand_id} value={b.brand_id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className='admin-label'>Mô tả</label>
              <AdminAutosizeTextarea
                value={form.description}
                onChange={e =>
                  handleFormChange('description', e.target.value)
                }
                min_rows={4}
                className='w-full'
                placeholder='Mô tả sản phẩm…'
              />
            </div>
          </div>
        </section>

        {/* ─── Specs ─── */}
        {spec_attributes.length > 0 && (
          <section className='admin-card'>
            <h2 className='admin-section-title'>Thông số</h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {spec_attributes.map(attr => (
                <div key={attr.attribute_id}>
                  <label className='admin-label'>{attr.name}</label>
                  <AdminAutosizeTextarea
                    value={specs[attr.attribute_id] || ''}
                    onChange={e =>
                      handleSpecChange(attr.attribute_id, e.target.value)
                    }
                    min_rows={2}
                    max_height_px={280}
                    className='w-full'
                    placeholder={`Nhập ${attr.name}…`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Options + matrix ─── */}
        <section className='admin-card'>
          <h2 className='admin-section-title mb-2'>
            Tuỳ chọn & biến thể
          </h2>
          <p className='mb-6 text-xs text-[#64748b]'>
            Chip theo kiểu Shopee/Shopify: thêm các giá trị trên mỗi trục. Hệ
            thống sinh đủ tổ hợp tích Descartes. Dùng bulk để chỉnh giá / tồn
            hàng loạt và sinh SKU tự động.
          </p>
          <ChipOptionAxesEditor
            axes={axes}
            gallery_axis_index={0}
            gallery_upload_resolver={handle_gallery_upload}
            on_axes_change={handle_axes_change_stable}
            on_add_axis={handle_add_axis_row}
            on_remove_axis={handle_remove_axis_row}
          />

          <div className='mt-8'>
            <CreateVariantMatrixPanel
              axes={axes}
              product_options={product_options}
              variants={variants}
              patch_variant_fields={patch_variant_fields}
              sku_prefix={matrix_sku_prefix}
              on_sku_prefix_change={set_matrix_sku_prefix}
            />
          </div>
        </section>

        {/* ─── Error / actions ─── */}
        {error && (
          <div className='rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <div className='flex items-center justify-end gap-3'>
          <button
            type='button'
            onClick={() => navigate('/admin/products')}
            className='admin-btn-ghost'
          >
            Hủy
          </button>
          <button
            type='submit'
            disabled={loading}
            className='admin-btn-primary'
          >
            {loading ? 'Đang tạo…' : 'Tạo sản phẩm'}
          </button>
        </div>
      </form>
    </div>
  )
}
