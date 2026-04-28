import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminAttributeApi,
  adminCategoryApi
} from '../../../services/adminApi.js'

export default function AttributeList() {
  const [categories, setCategories] = useState([])
  const [selected_category_id, setSelectedCategoryId] = useState('')
  const [attributes, setAttributes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [new_attribute_name, setNewAttributeName] = useState('')

  const [editing_attribute_id, setEditingAttributeId] = useState(null)
  const [editing_attribute_name, setEditingAttributeName] = useState('')

  const selected_category = useMemo(
    () => categories.find(item => String(item.category_id) === selected_category_id),
    [categories, selected_category_id]
  )

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminCategoryApi.getAll()
      const category_items = res.data.data || []
      setCategories(category_items)
      if (category_items.length > 0 && !selected_category_id) {
        setSelectedCategoryId(String(category_items[0].category_id))
      }
    } catch {
      setCategories([])
    }
  }, [selected_category_id])

  const fetchAttributes = useCallback(async category_id => {
    if (!category_id) {
      setAttributes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await adminAttributeApi.getByCategory(category_id)
      setAttributes(res.data.data || [])
    } catch {
      setAttributes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchAttributes(selected_category_id)
  }, [fetchAttributes, selected_category_id])

  const handleCreateAttribute = async e => {
    e.preventDefault()
    if (!selected_category_id || !new_attribute_name.trim()) return

    try {
      setSubmitting(true)
      await adminAttributeApi.create({
        name: new_attribute_name.trim(),
        category_id: Number(selected_category_id)
      })
      setNewAttributeName('')
      fetchAttributes(selected_category_id)
    } catch (err) {
      alert(err.message || 'Failed to create attribute')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateAttribute = async attribute_id => {
    if (!editing_attribute_name.trim()) return

    try {
      setSubmitting(true)
      await adminAttributeApi.update(attribute_id, {
        name: editing_attribute_name.trim()
      })
      setEditingAttributeId(null)
      setEditingAttributeName('')
      fetchAttributes(selected_category_id)
    } catch (err) {
      alert(err.message || 'Failed to update attribute')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAttribute = async attribute_id => {
    if (!window.confirm('Delete this attribute?')) return

    try {
      setSubmitting(true)
      await adminAttributeApi.delete(attribute_id)
      fetchAttributes(selected_category_id)
    } catch (err) {
      alert(err.message || 'Failed to delete attribute')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8'>
      <div>
        <h1 className='font-display text-2xl font-bold text-white'>
          Attributes (EAV)
        </h1>
        <p className='text-sm text-[#64748b]'>
          Manage SPEC attributes by category
        </p>
      </div>

      <section className='admin-card space-y-4'>
        <div className='w-full sm:w-72'>
          <label className='admin-label'>Category</label>
          <select
            value={selected_category_id}
            onChange={e => setSelectedCategoryId(e.target.value)}
            className='admin-select w-full'
          >
            <option value=''>Select category...</option>
            {categories.map(item => (
              <option key={item.category_id} value={item.category_id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <form
          onSubmit={handleCreateAttribute}
          className='grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]'
        >
          <input
            type='text'
            value={new_attribute_name}
            onChange={e => setNewAttributeName(e.target.value)}
            placeholder='Attribute name'
            className='admin-input'
          />
          <button
            type='submit'
            disabled={!selected_category_id || submitting}
            className='admin-btn-primary'
          >
            Add attribute
          </button>
        </form>
      </section>

      <section className='space-y-4'>
        {loading ? (
          <div className='admin-card text-center text-[#64748b]'>Loading...</div>
        ) : !selected_category ? (
          <div className='admin-card text-center text-[#64748b]'>
            Select a category to manage attributes
          </div>
        ) : attributes.length === 0 ? (
          <div className='admin-card text-center text-[#64748b]'>
            No attributes for this category
          </div>
        ) : (
          attributes.map(attribute_item => (
            <article
              key={attribute_item.attribute_id}
              className='rounded-xl border border-white/10 bg-[#0d0d1a]/80 p-4'
            >
              <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='rounded-md bg-[#7c3aed]/20 px-2 py-0.5 text-xs text-[#c4b5fd]'>
                    SPEC
                  </span>
                  <span className='text-sm text-[#64748b]'>
                    #{attribute_item.attribute_id}
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  {editing_attribute_id === attribute_item.attribute_id ? (
                    <>
                      <button
                        type='button'
                        onClick={() => handleUpdateAttribute(attribute_item.attribute_id)}
                        className='rounded-md border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10'
                      >
                        Save
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setEditingAttributeId(null)
                          setEditingAttributeName('')
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
                          setEditingAttributeId(attribute_item.attribute_id)
                          setEditingAttributeName(attribute_item.name)
                        }}
                        className='admin-btn-ghost !px-3 !py-1 text-xs'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDeleteAttribute(attribute_item.attribute_id)}
                        className='rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10'
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editing_attribute_id === attribute_item.attribute_id ? (
                <div>
                  <input
                    type='text'
                    value={editing_attribute_name}
                    onChange={e => setEditingAttributeName(e.target.value)}
                    className='admin-input'
                  />
                </div>
              ) : (
                <h3 className='text-base font-semibold text-white'>
                  {attribute_item.name}
                </h3>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  )
}
