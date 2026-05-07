/**
 * Tuỳ chọn sản phẩm: trục đầu có thể gắn nhiều ảnh / giá trị (gallery màu).
 */
import AdminAutosizeTextarea from './AdminAutosizeTextarea.jsx'

export default function ProductOptionsEditor({
  product_options,
  readonly = false,
  gallery_option_index = 0,
  patch_option_value_images = null,
  append_option_value_images = null,
  gallery_upload_resolver = null,
  gallery_upload_loading = false,
  onOptionNameChange,
  onAddOption,
  onRemoveOption,
  onValueChange,
  onAddValue,
  onRemoveValue
}) {
  if (!product_options.length) {
    return (
      <p className='text-sm text-[#64748b]'>
        Chưa có tùy chọn. Thêm trong luồng tạo sản phẩm hoặc dữ liệu cũ.
      </p>
    )
  }

  /** Slot URL chỉnh sửa; readonly chỉ có URL thật */
  const slots_for_urls = val => {
    const cleaned = (
      Array.isArray(val.images) ?
        val.images
          .map(s => String(s ?? '').trim())
          .filter(Boolean)
      : []
    );
    return !readonly ? (cleaned.length ? cleaned : ['']) : cleaned;
  }

  /** Gửi PATCH mảng URL (sau chỉnh từng ô) */
  const commit_urls = (oi, vi, arr_in) => {
    if (!patch_option_value_images || readonly || oi !== gallery_option_index)
      return
    const kept = arr_in.map(s => String(s ?? '').trim()).filter(Boolean)
    patch_option_value_images(oi, vi, kept)
  }

  /** Một ô URL trong block gallery */
  const render_url_slots = (opt_i, val_i, val) => {
    const slots = slots_for_urls(val)
    return (
      <div className='mt-2 space-y-2 rounded-md border border-white/10 bg-black/20 p-2'>
        {slots.map((ur, ii) => (
          <div key={`${opt_i}-${val_i}-u-${ii}`} className='flex gap-2'>
            {!readonly ?
              (
                <>
                  <AdminAutosizeTextarea
                    value={ur}
                    onChange={e => {
                      const next =
                        [...slots ];
                      next[ii] = e.target.value
                      commit_urls(opt_i, val_i, next)
                    }}
                    min_rows={1}
                    max_height_px={120}
                    placeholder='https://…'
                    className='min-w-0 flex-1'
                    spellCheck={false}
                  />
                  <button
                    type='button'
                    disabled={slots.length <= 1 && !ur?.trim?.()}
                    onClick={() => {
                      if (slots.length <= 1) {
                        commit_urls(opt_i, val_i, [])
                        return;
                      }
                      commit_urls(
                        opt_i,
                        val_i,
                        slots.filter((_skip, ij) => ij !== ii),
                      )
                    }}
                    className='shrink-0 text-[#f87171] disabled:opacity-30'
                  >
                    ✕
                  </button>
                </>
              )
            : ur?.trim?.() ?
              (
                <img
                  src={ur}
                  alt={val.value}
                  className='h-14 w-14 rounded-md object-cover'
                />
              )
            : null}
          </div>
        ))}
        {!readonly ?
          <>
            <button
              type='button'
              onClick={() => commit_urls(opt_i, val_i, [...slots, ''])}
              className='text-[11px] text-[#9f67ff] hover:text-[#c4b5fd]'
            >
              + Thêm URL ảnh
            </button>
            {gallery_upload_resolver ?
              (
                <label className='inline-flex cursor-pointer text-[11px] text-cyan-300'>
                  {gallery_upload_loading ? 'Đang tải…' : '+ Upload ảnh'}
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    disabled={gallery_upload_loading}
                    onChange={async eev => {
                      const files_now = Array.from(eev.target.files || [])
                      eev.target.value = '';
                      if (!files_now.length || !append_option_value_images)
                        return;
                      try {
                        const url_list_now =
                          await gallery_upload_resolver(files_now)
                        append_option_value_images(
                          opt_i,
                          val_i,
                          url_list_now,
                        )
                      } catch {
                        console.error('upload ov images failed')
                      }
                    }}
                  />
                </label>
              )
            : null}
          </>
        : null}
      </div>
    )
  }

  return (
    <div className='space-y-5'>
      {product_options.map((opt, oi) => (
        <div
          key={opt.option_id ?? `opt-${oi}`}
          className='rounded-xl border border-white/10 bg-white/[0.02] p-4'
        >
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            {readonly ?
              (
                <p className='font-display text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'>
                  {opt.name}
                </p>
              )
            : (
              <>
                <input
                  type='text'
                  value={opt.name}
                  onChange={e =>
                    onOptionNameChange(oi, e.target.value)}
                  placeholder='Tên (vd. Màu)'
                  className='admin-input min-w-[10rem] flex-1 sm:max-w-xs'
                />
                <button
                  type='button'
                  onClick={() => onRemoveOption(oi)}
                  disabled={product_options.length <= 1}
                  className='rounded-md border border-red-400/35 px-2 py-1 text-[11px] text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30'
                >
                  Xóa tùy chọn
                </button>
              </>
            )}
          </div>

          <ul className='space-y-3'>
            {opt.values.map((val, vi) => (
              <li
                key={val.option_value_id ?? `v-${oi}-${vi}`}
                className='rounded-lg bg-white/[0.02] p-3'
              >
                <div className='flex flex-wrap items-center gap-2'>
                  {readonly ?
                    (
                      <span className='rounded-md bg-white/5 px-2 py-1 text-sm text-[#e2e8f0]'>
                        {val.value}
                      </span>
                    )
                  : (
                    <>
                      <input
                        type='text'
                        value={val.value}
                        onChange={e =>
                          onValueChange(oi, vi, e.target.value)}
                        placeholder={`Giá trị ${vi + 1}`}
                        className='admin-input min-w-[8rem] flex-1 sm:max-w-sm'
                      />
                      <button
                        type='button'
                        onClick={() => onRemoveValue(oi, vi)}
                        disabled={opt.values.length <= 1}
                        className='text-[#f87171] transition hover:text-red-300 disabled:opacity-30'
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
                {oi === gallery_option_index &&
                patch_option_value_images ?
                  render_url_slots(oi, vi, val)
                : null}
              </li>
            ))}
          </ul>

          {!readonly && (
            <button
              type='button'
              onClick={() => onAddValue(oi)}
              className='mt-2 text-xs text-[#9f67ff] transition hover:text-[#c4b5fd]'
            >
              + Thêm giá trị cho &quot;{opt.name || '…'}&quot;
            </button>
          )}
        </div>
      ))}

      {!readonly && (
        <button
          type='button'
          onClick={onAddOption}
          className='rounded-md border border-white/20 px-3 py-1.5 text-xs text-[#cbd5e1] transition hover:border-[#9f67ff] hover:text-white'
        >
          + Thêm tuỳ chọn
        </button>
      )}
    </div>
  )
}
