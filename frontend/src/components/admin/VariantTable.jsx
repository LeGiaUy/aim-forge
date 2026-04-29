/**
 * VariantTable — shows generated variant rows for SKU / Price / Stock / Images input
 */
export default function VariantTable({
  variants,
  onRowChange,
  onImageChange,
  onAddImage,
  onRemoveImage,
  onRemoveVariant,
  onUploadImages,
  upload_loading_map = {}
}) {
  if (!variants.length) {
    return (
      <div className='flex h-24 items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-[#64748b]'>
        Add at least one variant color to continue
      </div>
    )
  }

  return (
    <div className='overflow-x-auto rounded-xl border border-white/10'>
      <table className='w-full text-sm'>
        <thead className='border-b border-white/10 bg-white/5'>
          <tr>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Color</th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>SKU</th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Stock</th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Images</th>
            <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>Actions</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-white/5'>
          {variants.map((v, vi) => (
            <tr key={vi} className='bg-white/[0.02] transition hover:bg-white/[0.05]'>
              <td className='px-4 py-3'>
                <input
                  type='text'
                  value={v.color}
                  onChange={e => onRowChange(vi, 'color', e.target.value)}
                  placeholder='e.g. Matte Black'
                  className='admin-input w-40'
                />
              </td>
              <td className='px-4 py-3'>
                <input
                  type='text'
                  value={v.sku}
                  onChange={e => onRowChange(vi, 'sku', e.target.value)}
                  placeholder='e.g. MOUSE-BLK-01'
                  className='admin-input w-40'
                />
              </td>
              <td className='px-4 py-3'>
                <input
                  type='number'
                  value={v.stock}
                  onChange={e => onRowChange(vi, 'stock', e.target.value)}
                  placeholder='0'
                  min='0'
                  className='admin-input w-20'
                />
              </td>
              <td className='px-4 py-3'>
                <div className='space-y-1.5'>
                  {v.images.map((img, ii) => (
                    <div key={ii} className='flex items-center gap-2'>
                      <input
                        type='url'
                        value={img}
                        onChange={e => onImageChange(vi, ii, e.target.value)}
                        placeholder='https://...'
                        className='admin-input flex-1'
                      />
                      <button
                        type='button'
                        onClick={() => onRemoveImage(vi, ii)}
                        disabled={v.images.length === 1}
                        className='text-[#f87171] transition hover:text-red-300 disabled:opacity-30'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type='button'
                    onClick={() => onAddImage(vi)}
                    className='text-xs text-[#9f67ff] transition hover:text-[#c4b5fd]'
                  >
                    + Add image
                  </button>
                  <label className='mt-1 inline-flex cursor-pointer text-xs text-cyan-300 transition hover:text-cyan-200'>
                    {upload_loading_map[vi] ? 'Uploading...' : '+ Upload files'}
                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      className='hidden'
                      disabled={upload_loading_map[vi]}
                      onChange={e => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 0) {
                          onUploadImages(vi, files)
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
              </td>
              <td className='px-4 py-3 text-right'>
                <button
                  type='button'
                  onClick={() => onRemoveVariant(vi)}
                  className='rounded-md border border-red-400/40 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/10'
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
