import { useCallback, useEffect, useState } from 'react'
import { adminBrandApi } from '../../../services/adminApi.js'

export default function BrandList() {
  const [brands, setBrands] = useState([])
  const [form, setForm] = useState({ name: '', country: '', image_url: '' })
  const [editing_id, setEditingId] = useState(null)
  const [editing_form, setEditingForm] = useState({
    name: '',
    country: '',
    image_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminBrandApi.getAll()
      setBrands(res.data.data || [])
    } catch {
      setBrands([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const handleCreate = async e => {
    e.preventDefault()
    if (!form.name.trim()) return

    try {
      setSubmitting(true)
      await adminBrandApi.create({
        name: form.name.trim(),
        country: form.country.trim(),
        image_url: form.image_url
      })
      setForm({ name: '', country: '', image_url: '' })
      fetchBrands()
    } catch (err) {
      alert(err.message || 'Failed to create brand')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async brand_id => {
    if (!editing_form.name.trim()) return

    try {
      setSubmitting(true)
      await adminBrandApi.update(brand_id, {
        name: editing_form.name.trim(),
        country: editing_form.country.trim(),
        image_url: editing_form.image_url
      })
      setEditingId(null)
      setEditingForm({ name: '', country: '', image_url: '' })
      fetchBrands()
    } catch (err) {
      alert(err.message || 'Failed to update brand')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async brand_id => {
    if (!window.confirm('Delete this brand?')) return

    try {
      setSubmitting(true)
      await adminBrandApi.delete(brand_id)
      fetchBrands()
    } catch (err) {
      alert(err.message || 'Failed to delete brand')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadCreate = async files => {
    if (!files.length) return

    const form_data = new FormData()
    files.forEach(file_item => form_data.append('images', file_item))

    try {
      setSubmitting(true)
      const response = await adminBrandApi.uploadImages(form_data)
      const image_url = response.data.data?.image_urls?.[0] || ''
      setForm(prev => ({ ...prev, image_url }))
    } catch (err) {
      alert(err.message || 'Failed to upload brand image')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadEdit = async files => {
    if (!files.length) return

    const form_data = new FormData()
    files.forEach(file_item => form_data.append('images', file_item))

    try {
      setSubmitting(true)
      const response = await adminBrandApi.uploadImages(form_data)
      const image_url = response.data.data?.image_urls?.[0] || ''
      setEditingForm(prev => ({ ...prev, image_url }))
    } catch (err) {
      alert(err.message || 'Failed to upload brand image')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-6xl space-y-6 px-4 py-8'>
      <div>
        <h1 className='font-display text-2xl font-bold text-white'>Brands</h1>
        <p className='text-sm text-[#64748b]'>Manage product brands</p>
      </div>

      <section className='admin-card'>
        <h2 className='admin-section-title'>Create brand</h2>
        <form
          onSubmit={handleCreate}
          className='grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px_1fr_auto]'
        >
          <input
            type='text'
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder='Brand name'
            className='admin-input'
          />
          <input
            type='text'
            value={form.country}
            onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
            placeholder='Country (optional)'
            className='admin-input'
          />
          <div className='space-y-2'>
            <label className='inline-flex cursor-pointer text-xs text-cyan-300 transition hover:text-cyan-200'>
              + Upload logo
              <input
                type='file'
                accept='image/*'
                className='hidden'
                onChange={e => {
                  const files = Array.from(e.target.files || [])
                  handleUploadCreate(files)
                  e.target.value = ''
                }}
              />
            </label>
            {form.image_url && (
              <img src={form.image_url} alt='Brand' className='h-10 w-10 rounded object-cover' />
            )}
          </div>
          <button type='submit' disabled={submitting} className='admin-btn-primary'>
            Add
          </button>
        </form>
      </section>

      <section className='overflow-hidden rounded-xl border border-white/10'>
        <table className='w-full text-sm'>
          <thead className='border-b border-white/10 bg-white/5'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>ID</th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Name</th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Country</th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Image</th>
              <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/5'>
            {loading ? (
              <tr>
                <td colSpan={5} className='px-4 py-10 text-center text-[#64748b]'>
                  Loading...
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-4 py-10 text-center text-[#64748b]'>
                  No brands
                </td>
              </tr>
            ) : (
              brands.map(item => (
                <tr key={item.brand_id}>
                  <td className='px-4 py-3 text-[#94a3b8]'>{item.brand_id}</td>
                  <td className='px-4 py-3'>
                    {editing_id === item.brand_id ? (
                      <input
                        type='text'
                        value={editing_form.name}
                        onChange={e =>
                          setEditingForm(prev => ({ ...prev, name: e.target.value }))
                        }
                        className='admin-input w-full'
                      />
                    ) : (
                      <span className='text-white'>{item.name}</span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    {editing_id === item.brand_id ? (
                      <input
                        type='text'
                        value={editing_form.country}
                        onChange={e =>
                          setEditingForm(prev => ({ ...prev, country: e.target.value }))
                        }
                        className='admin-input w-full'
                      />
                    ) : (
                      <span className='text-[#94a3b8]'>{item.country || '—'}</span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    {editing_id === item.brand_id ? (
                      <div className='space-y-2'>
                        <label className='inline-flex cursor-pointer text-xs text-cyan-300 transition hover:text-cyan-200'>
                          + Upload logo
                          <input
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={e => {
                              const files = Array.from(e.target.files || [])
                              handleUploadEdit(files)
                              e.target.value = ''
                            }}
                          />
                        </label>
                        {editing_form.image_url && (
                          <img
                            src={editing_form.image_url}
                            alt='Brand'
                            className='h-10 w-10 rounded object-cover'
                          />
                        )}
                      </div>
                    ) : item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className='h-10 w-10 rounded object-cover'
                      />
                    ) : (
                      <span className='text-[#64748b]'>—</span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex justify-end gap-2'>
                      {editing_id === item.brand_id ? (
                        <>
                          <button
                            type='button'
                            onClick={() => handleUpdate(item.brand_id)}
                            className='rounded-md border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10'
                          >
                            Save
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              setEditingId(null)
                              setEditingForm({
                                name: '',
                                country: '',
                                image_url: ''
                              })
                            }}
                            className='admin-btn-ghost !px-3 !py-1 text-xs'
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type='button'
                            onClick={() => {
                              setEditingId(item.brand_id)
                              setEditingForm({
                                name: item.name || '',
                                country: item.country || '',
                                image_url: item.image_url || ''
                              })
                            }}
                            className='admin-btn-ghost !px-3 !py-1 text-xs'
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDelete(item.brand_id)}
                            className='rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10'
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
