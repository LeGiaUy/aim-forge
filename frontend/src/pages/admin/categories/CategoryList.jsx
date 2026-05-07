import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminCategoryApi } from '../../../services/adminApi.js'

export default function CategoryList() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', image_url: '' })
  const [editing_id, setEditingId] = useState(null)
  const [editing_form, setEditingForm] = useState({ name: '', image_url: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminCategoryApi.getAll()
      setCategories(res.data.data || [])
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCreate = async e => {
    e.preventDefault()
    if (!form.name.trim()) return

    try {
      setSubmitting(true)
      await adminCategoryApi.create({
        name: form.name.trim(),
        image_url: form.image_url
      })
      setForm({ name: '', image_url: '' })
      fetchCategories()
    } catch (err) {
      alert(err.message || 'Không thể tạo danh mục')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async category_id => {
    if (!editing_form.name.trim()) return

    try {
      setSubmitting(true)
      await adminCategoryApi.update(category_id, {
        name: editing_form.name.trim(),
        image_url: editing_form.image_url
      })
      setEditingId(null)
      setEditingForm({ name: '', image_url: '' })
      fetchCategories()
    } catch (err) {
      alert(err.message || 'Không thể cập nhật danh mục')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async category_id => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return

    try {
      setSubmitting(true)
      await adminCategoryApi.delete(category_id)
      fetchCategories()
    } catch (err) {
      alert(err.message || 'Không thể xóa danh mục')
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
      const response = await adminCategoryApi.uploadImages(form_data)
      const image_url = response.data.data?.image_urls?.[0] || ''
      setForm(prev => ({ ...prev, image_url }))
    } catch (err) {
      alert(err.message || 'Không thể tải ảnh danh mục')
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
      const response = await adminCategoryApi.uploadImages(form_data)
      const image_url = response.data.data?.image_urls?.[0] || ''
      setEditingForm(prev => ({ ...prev, image_url }))
    } catch (err) {
      alert(err.message || 'Không thể tải ảnh danh mục')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-5xl space-y-6 px-4 py-8'>
      <div>
        <h1 className='font-display text-2xl font-bold text-white'>
          Danh mục
        </h1>
        <p className='text-sm text-[#64748b]'>Quản lý danh mục sản phẩm</p>
      </div>

      <section className='admin-card'>
        <h2 className='admin-section-title'>Tạo danh mục</h2>
        <form
          onSubmit={handleCreate}
          className='grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]'
        >
          <input
            type='text'
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder='Tên danh mục'
            className='admin-input flex-1'
          />
          <div className='flex min-h-10 items-center gap-2'>
            {!!form.image_url && (
              <img
                src={form.image_url}
                alt='Danh mục'
                className='h-10 w-10 rounded object-cover'
              />
            )}
            <label className='inline-flex cursor-pointer text-xs text-cyan-300 transition hover:text-cyan-200'>
              + Tải logo
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
          </div>
          <button
            type='submit'
            disabled={submitting}
            className='admin-btn-primary self-start'
          >
            Thêm
          </button>
        </form>
      </section>

      <section className='rounded-xl border border-white/10'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm overflow-visible'>
          <thead className='border-b border-white/10 bg-white/5'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>ID</th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Tên</th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Ảnh</th>
              <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Thao tác</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/5'>
            {loading ? (
              <tr>
                <td colSpan={4} className='px-4 py-10 text-center text-[#64748b]'>
                  Đang tải...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className='px-4 py-10 text-center text-[#64748b]'>
                  Chưa có danh mục
                </td>
              </tr>
            ) : (
              categories.map(item => (
                <tr key={item.category_id}>
                  <td className='px-4 py-3 text-[#94a3b8]'>{item.category_id}</td>
                  <td className='px-4 py-3'>
                    {editing_id === item.category_id ? (
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
                    {editing_id === item.category_id ? (
                      <div className='flex min-h-10 items-center gap-2'>
                        {!!editing_form.image_url && (
                          <img
                            src={editing_form.image_url}
                            alt='Danh mục'
                            className='h-10 w-10 rounded object-cover'
                          />
                        )}
                        <label className='inline-flex cursor-pointer text-xs text-cyan-300 transition hover:text-cyan-200'>
                          + Tải logo
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
                      {editing_id === item.category_id ? (
                        <>
                          <button
                            type='button'
                            onClick={() => handleUpdate(item.category_id)}
                            className='rounded-md border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10'
                          >
                            Lưu
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              setEditingId(null)
                              setEditingForm({ name: '', image_url: '' })
                            }}
                            className='admin-btn-ghost !px-3 !py-1 text-xs'
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/admin/attributes?category_id=${item.category_id}`}
                            className='admin-btn-ghost !px-3 !py-1 text-xs'
                          >
                            Thuộc tính
                          </Link>

                          <button
                            type='button'
                            onClick={() => {
                              setEditingId(item.category_id)
                              setEditingForm({
                                name: item.name || '',
                                image_url: item.image_url || ''
                              })
                            }}
                            className='admin-btn-ghost !px-3 !py-1 text-xs'
                          >
                            Sửa
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDelete(item.category_id)}
                            className='rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10'
                          >
                            Xóa
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
        </div>
      </section>
    </div>
  )
}
