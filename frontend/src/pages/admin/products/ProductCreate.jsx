import { useNavigate } from 'react-router-dom'
import VariantTable from '../../../components/admin/VariantTable.jsx'
import { useProductForm } from '../../../hooks/useProductForm.js'
import { adminProductApi } from '../../../services/adminApi.js'

export default function ProductCreate() {
  const navigate = useNavigate()
  const {
    form,
    categories,
    brands,
    attributes,
    specs,
    variants,
    loading,
    error,
    setLoading,
    setError,
    handleFormChange,
    handleSpecChange,
    handleVariantRowChange,
    handleVariantImageChange,
    addVariantImage,
    removeVariantImage,
    addVariantRow,
    removeVariantRow,
    buildPayload
  } = useProductForm()

  const spec_attributes = attributes
  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.category_id || !form.brand_id) {
      setError('Name, category, and brand are required.')
      return
    }
    if (!variants.length) {
      setError('Please select variant attribute values to generate at least one variant.')
      return
    }
    for (const v of variants) {
      if (!v.color?.trim()) {
        setError('Please enter color for each variant.')
        return
      }
      if (!v.price || Number(v.price) <= 0) {
        setError(`Please enter a valid price for variant "${v.color}".`)
        return
      }
    }

    try {
      setLoading(true)
      const payload = buildPayload()
      await adminProductApi.create(payload)
      navigate('/admin/products')
    } catch (err) {
      setError(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto max-w-5xl space-y-8 px-4 py-8'>
      <div>
        <button
          type='button'
          onClick={() => navigate('/admin/products')}
          className='mb-2 text-sm text-[#64748b] transition hover:text-[#9f67ff]'
        >
          ← Back to Products
        </button>
        <h1 className='font-display text-2xl font-bold text-white'>Create New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* ─── Basic Info ─── */}
        <section className='admin-card'>
          <h2 className='admin-section-title'>Basic Information</h2>
          <div className='space-y-4'>
            <div>
              <label className='admin-label'>Product Name *</label>
              <input
                type='text'
                value={form.name}
                onChange={e => handleFormChange('name', e.target.value)}
                className='admin-input w-full'
                placeholder='e.g. Lamzu Maya X 8K'
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='admin-label'>Category *</label>
                <select
                  value={form.category_id}
                  onChange={e => handleFormChange('category_id', e.target.value)}
                  className='admin-select w-full'
                >
                  <option value=''>Select category...</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='admin-label'>Brand *</label>
                <select
                  value={form.brand_id}
                  onChange={e => handleFormChange('brand_id', e.target.value)}
                  className='admin-select w-full'
                >
                  <option value=''>Select brand...</option>
                  {brands.map(b => (
                    <option key={b.brand_id} value={b.brand_id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className='admin-label'>Description</label>
              <textarea
                value={form.description}
                onChange={e => handleFormChange('description', e.target.value)}
                rows={5}
                className='admin-input w-full resize-y'
                placeholder='Product description...'
              />
            </div>
          </div>
        </section>

        {/* ─── Spec Attributes ─── */}
        {spec_attributes.length > 0 && (
          <section className='admin-card'>
            <h2 className='admin-section-title'>Specifications</h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {spec_attributes.map(attr => (
                <div key={attr.attribute_id}>
                  <label className='admin-label'>{attr.name}</label>
                  <input
                    type='text'
                    value={specs[attr.attribute_id] || ''}
                    onChange={e => handleSpecChange(attr.attribute_id, e.target.value)}
                    className='admin-input w-full'
                    placeholder={`Enter ${attr.name}...`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Variant Table ─── */}
        <section className='admin-card'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <h2 className='admin-section-title !mb-0'>
              Variants
              {variants.length > 0 && (
                <span className='ml-2 rounded-full bg-[#7c3aed]/20 px-2 py-0.5 text-xs text-[#c4b5fd]'>
                  {variants.length} generated
                </span>
              )}
            </h2>
            <button
              type='button'
              onClick={addVariantRow}
              className='rounded-md border border-white/20 px-3 py-1.5 text-xs text-[#cbd5e1] transition hover:border-[#9f67ff] hover:text-white'
            >
              + Add variant
            </button>
          </div>
          <VariantTable
            variants={variants}
            onRowChange={handleVariantRowChange}
            onImageChange={handleVariantImageChange}
            onAddImage={addVariantImage}
            onRemoveImage={removeVariantImage}
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
            Cancel
          </button>
          <button
            type='submit'
            disabled={loading}
            className='admin-btn-primary'
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
