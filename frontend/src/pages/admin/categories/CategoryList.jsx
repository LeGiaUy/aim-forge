import { useCallback, useEffect, useState } from 'react'
import { adminCategoryApi } from '../../../services/adminApi.js'

export default function CategoryList() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [editing_id, setEditingId] = useState(null)
  const [editing_name, setEditingName] = useState('')
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
    if (!name.trim()) return

    try {
      setSubmitting(true)
      await adminCategoryApi.create({ name: name.trim() })
      setName('')
      fetchCategories()
    } catch (err) {
      alert(err.message || 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async category_id => {
    if (!editing_name.trim()) return

    try {
      setSubmitting(true)
      await adminCategoryApi.update(category_id, { name: editing_name.trim() })
      setEditingId(null)
      setEditingName('')
      fetchCategories()
    } catch (err) {
      alert(err.message || 'Failed to update category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async category_id => {
    if (!window.confirm('Delete this category?')) return

    try {
      setSubmitting(true)
      await adminCategoryApi.delete(category_id)
      fetchCategories()
    } catch (err) {
      alert(err.message || 'Failed to delete category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-5xl space-y-6 px-4 py-8'>
      <div>
        <h1 className='font-display text-2xl font-bold text-white'>Categories</h1>
        <p className='text-sm text-[#64748b]'>Manage product categories</p>
      </div>

      <section className='admin-card'>
        <h2 className='admin-section-title'>Create category</h2>
        <form onSubmit={handleCreate} className='flex flex-col gap-3 sm:flex-row'>
          <input
            type='text'
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='Category name'
            className='admin-input flex-1'
          />
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
              <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/5'>
            {loading ? (
              <tr>
                <td colSpan={3} className='px-4 py-10 text-center text-[#64748b]'>
                  Loading...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className='px-4 py-10 text-center text-[#64748b]'>
                  No categories
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
                        value={editing_name}
                        onChange={e => setEditingName(e.target.value)}
                        className='admin-input w-full'
                      />
                    ) : (
                      <span className='text-white'>{item.name}</span>
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
                            Save
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              setEditingId(null)
                              setEditingName('')
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
                              setEditingId(item.category_id)
                              setEditingName(item.name)
                            }}
                            className='admin-btn-ghost !px-3 !py-1 text-xs'
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDelete(item.category_id)}
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
