import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminAutosizeTextarea from '../../../components/admin/AdminAutosizeTextarea.jsx'
import ProductOptionsEditor from '../../../components/admin/ProductOptionsEditor.jsx'
import VariantTable from '../../../components/admin/VariantTable.jsx'
import { useProductForm } from '../../../hooks/useProductForm.js'
import { adminProductApi } from '../../../services/adminApi.js'
import {
  format_price_display,
  normalize_price_input
} from '../../../utils/priceInput.js'

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initial_data, setInitialData] = useState(null)
  const [fetch_loading, setFetchLoading] = useState(true)
  const [fetch_error, setFetchError] = useState('')

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
    handle_variant_option_change,
    handleVariantRowChange,
    patch_option_value_images,
    append_option_value_images,
    addVariantRow,
    removeVariantRow,
    buildPayload,
    handle_option_name_change,
    add_product_option,
    remove_product_option,
    handle_option_value_change,
    add_option_value,
    remove_option_value
  } = useProductForm(initial_data, { edit_mode: true })

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setFetchLoading(true)
        const res = await adminProductApi.getById(id)
        setInitialData(res.data.data)
      } catch (err) {
        setFetchError(err.message || 'Không tải được sản phẩm')
      } finally {
        setFetchLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const spec_attributes = attributes

  const [gallery_upload_busy, set_gallery_upload_busy] = useState(false)

  const resolve_gallery_upload = useCallback(async files_in => {
    const form_blob = new FormData()
    files_in.forEach(f => form_blob.append('images', f))
    const response = await adminProductApi.uploadImages(form_blob)
    return response.data.data?.image_urls || []
  }, [])

  const gallery_upload_resolver = useCallback(
    async files_in => {
      set_gallery_upload_busy(true)
      try {
        return await resolve_gallery_upload(files_in)
      } catch (err) {
        setError(err.message || 'Không tải gallery lên')
        return []
      } finally {
        set_gallery_upload_busy(false)
      }
    },
    [resolve_gallery_upload]
  )

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

  const handleSubmit = async e => {
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
    if (!variants.length) {
      setError('Thêm ít nhất một biến thể.')
      return
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if (!nonempty_money_ok(v.price)) {
        setError(`Biến thể ${i + 1}: nhập giá bán (≥ 0).`)
        return
      }
      if (
        !optional_money_ok(v.compare_price) ||
        !optional_money_ok(v.cost_price)
      ) {
        setError(
          `Biến thể ${i + 1}: giá niêm yết / giá vốn không hợp lệ hoặc âm.`
        )
        return
      }
    }

    if (product_options.length) {
      for (const v of variants) {
        const ids = v.option_value_ids || []
        if (ids.length !== product_options.length) {
          setError('Mỗi biến thể phải chọn đủ giá trị cho từng tùy chọn.')
          return
        }
        if (ids.some(id => !id)) {
          setError('Không được để trống lựa chọn tùy chọn trên biến thể.')
          return
        }
      }
    }

    try {
      setLoading(true)
      const payload = buildPayload()
      await adminProductApi.update(id, payload)
      navigate('/admin/products')
    } catch (err) {
      setError(err.message || 'Không cập nhật được sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  if (fetch_loading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center text-[#64748b]'>
        Đang tải sản phẩm…
      </div>
    )
  }
  if (fetch_error) {
    return (
      <div className='mx-auto max-w-5xl px-4 py-8'>
        <div className='rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-red-300'>
          {fetch_error}
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-5xl space-y-8 px-4 py-8'>
      <div>
        <button
          type='button'
          onClick={() => navigate('/admin/products')}
          className='mb-2 text-sm text-[#64748b] transition hover:text-[#9f67ff]'
        >
          ← Về danh sách sản phẩm
        </button>
        <h1 className='font-display text-2xl font-bold text-white'>
          Sửa sản phẩm
          <span className='ml-2 text-base font-normal text-[#64748b]'>#{id}</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* ─── Basic Info ─── */}
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
              />
            </div>
            <div>
              <label className='admin-label'>Giá listing (₫)</label>
              <p className='mb-1.5 text-xs text-[#64748b]'>
                Tuỳ chọn — tham chiếu trên danh sách. Để trống khi gửi: đồng bộ min
                giá biến thể.
              </p>
              <input
                type='text'
                inputMode='numeric'
                value={format_price_display(form.price)}
                onChange={e =>
                  handleFormChange('price', normalize_price_input(e.target.value))
                }
                className='admin-input w-full max-w-md'
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
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
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
                    <option key={b.brand_id} value={b.brand_id}>{b.name}</option>
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
              />
            </div>
          </div>
        </section>

        {/* ─── Spec Attributes ─── */}
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

        {/* ─── Product options (+ ảnh trục đầu) ─── */}
        <section className='admin-card'>
          <h2 className='admin-section-title mb-2'>Tuỳ chọn & ảnh gian hàng</h2>
          <p className='mb-4 text-xs text-[#64748b]'>
            Ảnh gắn theo giá trị của trục đầu (vd. &quot;Màu&quot;); mọi biến
            thể cùng một màu chia sẻ cùng bộ ảnh. Combo SKU chỉnh ở bảng biến
            thể bên dưới.
          </p>
          {product_options.length > 0 ? (
            <ProductOptionsEditor
              product_options={product_options}
              readonly={false}
              gallery_option_index={0}
              patch_option_value_images={patch_option_value_images}
              append_option_value_images={append_option_value_images}
              gallery_upload_resolver={gallery_upload_resolver}
              gallery_upload_loading={gallery_upload_busy}
              onOptionNameChange={handle_option_name_change}
              onAddOption={add_product_option}
              onRemoveOption={remove_product_option}
              onValueChange={handle_option_value_change}
              onAddValue={add_option_value}
              onRemoveValue={remove_option_value}
            />
          ) : (
            <p className='text-sm text-[#64748b]'>
              Sản phẩm chưa có tùy chọn (dữ liệu cũ). Chỉ sửa SKU / giá / tồn.
            </p>
          )}
        </section>

        {/* ─── Variant Table ─── */}
        <section className='admin-card'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <h2 className='admin-section-title !mb-0'>
              Biến thể
              {variants.length > 0 && (
                <span className='ml-2 rounded-full bg-[#7c3aed]/20 px-2 py-0.5 text-xs text-[#c4b5fd]'>
                  {variants.length} biến thể
                </span>
              )}
            </h2>
            <button
              type='button'
              onClick={addVariantRow}
              className='rounded-md border border-white/20 px-3 py-1.5 text-xs text-[#cbd5e1] transition hover:border-[#9f67ff] hover:text-white'
            >
              + Thêm biến thể
            </button>
          </div>
          <VariantTable
            product_options={
              product_options.length
                ? product_options
                : []
            }
            is_edit_mode
            variants={variants}
            onRowChange={handleVariantRowChange}
            onVariantOptionChange={handle_variant_option_change}
            onRemoveVariant={removeVariantRow}
          />
        </section>

        {/* ─── Error & Submit ─── */}
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
            {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  )
}
