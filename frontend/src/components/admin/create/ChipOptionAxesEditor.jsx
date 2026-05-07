import { useCallback, useState } from 'react'
import AdminAutosizeTextarea from '../AdminAutosizeTextarea.jsx'

/**
 * Một ô URL ảnh trong danh sách ảnh của một nhãn (màu)
 */
function GalleryUrlRow({
  url_index,
  url_value,
  on_change,
  on_remove,
  can_remove
}) {
  return (
    <div className='flex flex-wrap items-start gap-2'>
      <AdminAutosizeTextarea
        value={url_value}
        onChange={e => on_change(url_index, e.target.value)}
        min_rows={1}
        max_height_px={140}
        placeholder='https://...'
        className='min-w-0 flex-1'
        spellCheck={false}
      />
      <button
        type='button'
        onClick={() => on_remove(url_index)}
        disabled={!can_remove}
        className='shrink-0 pt-2 text-[#f87171] hover:text-red-300 disabled:opacity-30'
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Khối nhiều ảnh cho một nhãn (giá trị trục gallery — vd. một màu)
 */
function ValueGallerySection({
  value_label,
  urls,
  on_urls_change,
  upload_resolver,
  upload_busy
}) {
  const normalized = urls.length ? urls : [''];

  /** Ghi một URL và cập nhật mảng (bỏ dòng trắng nếu còn dòng khác) */
  const handle_row_change = useCallback(
    (url_index, next_raw) => {
      const next = normalized.map((u, ii) =>
        ii === url_index ? next_raw : u
      );
      const trimmed = next.map(u => String(u ?? '').trim());
      const nonempty = trimmed.filter(Boolean);
      on_urls_change(
        nonempty.length ? trimmed : trimmed.map(() => '')
      );
    },
    [normalized, on_urls_change]
  )

  /** Xóa một dòng URL */
  const handle_remove_row = useCallback(
    url_index => {
      if (normalized.length <= 1) {
        on_urls_change([]);
        return;
      }
      on_urls_change(
        normalized.filter((_u, ii) => ii !== url_index)
      );
    },
    [normalized, on_urls_change]
  )

  const handle_add_blank = useCallback(() => {
    on_urls_change([...normalized, '']);
  }, [normalized, on_urls_change])

  /** Tải lên CDN / storage, nối URL vào nhãn này */
  const handle_file_input = useCallback(
    async e => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length || !upload_resolver) return;
      try {
        const got = await upload_resolver(files);
        const merged =
          [...normalized.map(u => String(u).trim()), ...got];
        const clean = merged.filter(Boolean);
        on_urls_change(clean.length ? merged : []);
      } catch {
        console.error('gallery upload failed');
      }
    },
    [normalized, on_urls_change, upload_resolver]
  )

  return (
    <div className='rounded-md border border-white/10 bg-black/20 p-3'>
      <p className='mb-2 text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]'>
        Ảnh cho &quot;{value_label}&quot;
      </p>
      <div className='space-y-2'>
        {normalized.map((u, ii) => (
          <GalleryUrlRow
            key={`${value_label}-${ii}`}
            url_index={ii}
            url_value={u}
            on_change={handle_row_change}
            on_remove={handle_remove_row}
            can_remove={normalized.length > 1 || Boolean(u?.trim?.())}
          />
        ))}
      </div>
      <div className='mt-2 flex flex-wrap items-center gap-3'>
        <button
          type='button'
          onClick={handle_add_blank}
          className='text-xs text-[#9f67ff] hover:text-[#c4b5fd]'
        >
          + Thêm ô URL
        </button>
        {upload_resolver && (
          <label className='cursor-pointer text-xs text-cyan-300 hover:text-cyan-200'>
            {upload_busy ? 'Đang tải…' : '+ Tải ảnh lên'}
            <input
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              disabled={upload_busy}
              onChange={handle_file_input}
            />
          </label>
        )}
      </div>
    </div>
  )
}

/**
 * Một trục tùy chọn với ô tên + chip giá trị (+ ảnh nếu là trục gallery)
 */
function OptionAxisRow({
  axis_index,
  axis,
  gallery_axis_index,
  on_name_change,
  on_values_change,
  bump_value_images,
  upload_resolver,
  gallery_upload_loading
}) {
  const [draft_value, set_draft_value] = useState('')

  /** Danh sách nhãn hiển thị chip */
  const tags = axis.values.filter(v => String(v).trim())

  /** Map URL theo nhãn; trục không phải gallery vẫn nhận object rỗng */
  const value_images = axis.value_images || {};

  const commit_tag = useCallback(() => {
    const t = draft_value.trim()
    if (!t) return
    if (tags.includes(t)) {
      set_draft_value('')
      return
    }
    on_values_change(axis_index, [...tags, t])
    set_draft_value('')
  }, [axis_index, draft_value, on_values_change, tags])

  const remove_tag = useCallback(
    value_to_remove => {
      on_values_change(
        axis_index,
        tags.filter(t => t !== value_to_remove)
      )
      if (
        gallery_axis_index === axis_index &&
        value_images[value_to_remove]
      ) {
        const next_vis = { ...value_images };
        delete next_vis[value_to_remove];
        bump_value_images(axis_index, next_vis);
      }
    },
    [
      axis_index,
      bump_value_images,
      gallery_axis_index,
      on_values_change,
      tags,
      value_images
    ]
  )

  /** Cập nhật mảng URL cho một nhãn */
  const set_urls_for_tag = useCallback(
    (tag, next_urls) => {
      const cleaned = next_urls.map(s => String(s ?? '').trim());
      const next_vis = { ...value_images };
      const kept = cleaned.filter(Boolean);
      if (!kept.length) {
        delete next_vis[tag];
      } else {
        next_vis[tag] = kept;
      }
      bump_value_images(axis_index, next_vis);
    },
    [axis_index, bump_value_images, value_images]
  )

  const show_gallery =
    gallery_axis_index === axis_index && tags.length > 0

  return (
    <div className='rounded-lg border border-white/10 bg-white/[0.02] p-4'>
      <div className='mb-2 flex flex-wrap items-center gap-2'>
        <span className='text-xs text-[#64748b]'>Tên trục</span>
        <input
          type='text'
          value={axis.name}
          onChange={e => on_name_change(axis_index, e.target.value)}
          placeholder='vd. Màu'
          className='admin-input min-w-[8rem] max-w-xs flex-1'
        />
      </div>
      <div className='flex flex-wrap items-start gap-2'>
        <span className='pt-2 text-xs text-[#64748b]'>Giá trị</span>
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <div className='flex flex-wrap gap-2'>
            {tags.map(tag => (
              <span
                key={tag}
                className={
                  'inline-flex items-center gap-1 rounded-full border ' +
                  'border-violet-500/40 bg-violet-500/15 px-2.5 py-1 ' +
                  'text-xs text-violet-200'
                }
              >
                {tag}
                <button
                  type='button'
                  aria-label={`Xóa ${tag}`}
                  onClick={() => remove_tag(tag)}
                  className='text-violet-300/80 hover:text-white'
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className='flex flex-wrap gap-2'>
            <input
              type='text'
              value={draft_value}
              onChange={e => set_draft_value(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit_tag()
                }
              }}
              placeholder='Thêm và nhập Enter…'
              className='admin-input max-w-xs flex-1'
            />
            <button
              type='button'
              onClick={commit_tag}
              className={
                'rounded-md border border-white/15 px-2 py-1 text-xs ' +
                'text-[#cbd5e1] hover:border-[#9f67ff]'
              }
            >
              Thêm
            </button>
          </div>
        </div>
      </div>
      {show_gallery ? (
        <div className='mt-4 space-y-3 border-t border-white/10 pt-4'>
          <p className='text-[11px] leading-relaxed text-[#64748b]'>
            Trục đầu là &quot;màu / kiểu hiển thị gallery&quot;: mỗi giá
            trị có thể gắn nhiều ảnh; mọi biến thể cùng màu dùng chung bộ ảnh.
          </p>
          <div className='space-y-3'>
            {tags.map(tag => (
              <ValueGallerySection
                key={`gal-${axis_index}-${tag}`}
                value_label={tag}
                urls={
                  value_images[tag]?.length ?
                    [...value_images[tag]]
                  : []
                }
                on_urls_change={next => set_urls_for_tag(tag, next)}
                upload_resolver={upload_resolver}
                upload_busy={gallery_upload_loading}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Nhiều trục tùy chọn dạng chip (Color, Size, …)
 */
export default function ChipOptionAxesEditor({
  axes,
  on_axes_change,
  on_add_axis,
  on_remove_axis,
  gallery_axis_index = 0,
  gallery_upload_resolver = null
}) {
  const [gallery_upload_loading, set_gallery_upload_loading] =
    useState(false)

  /** Ghi lại map ảnh cho một trục */
  const bump_value_images = useCallback(
    (axis_idx, next_map) => {
      on_axes_change(
        axes.map((a, ai) =>
          ai === axis_idx ? { ...a, value_images: next_map } : a
        )
      )
    },
    [axes, on_axes_change]
  )

  const wrapped_upload = useCallback(
    async files => {
      if (!gallery_upload_resolver) return [];
      set_gallery_upload_loading(true)
      try {
        return await gallery_upload_resolver(files);
      } finally {
        set_gallery_upload_loading(false)
      }
    },
    [gallery_upload_resolver]
  )

  const handle_name_change = useCallback(
    (axis_index, name) => {
      const next = axes.map((a, i) =>
        i === axis_index ? { ...a, name } : a
      );
      on_axes_change(next);
    },
    [axes, on_axes_change]
  )

  const handle_values_change = useCallback(
    (axis_index, values) => {
      const prev_axis = axes[axis_index];
      const next_vis = {};
      values.forEach(t => {
        const key = String(t).trim();
        if (
          prev_axis?.value_images &&
          prev_axis.value_images[key]
        ) next_vis[key] = prev_axis.value_images[key];
      })
      const next = axes.map((a, i) =>
        i === axis_index ?
          {
            ...a,
            values,
            value_images:
              gallery_axis_index === axis_index ?
                next_vis
              : a.value_images,
          }
        : a
      );
      on_axes_change(next);
    },
    [axes, gallery_axis_index, on_axes_change]
  )

  return (
    <div className='space-y-4'>
      {axes.map((axis, axis_index) => (
        <div key={`axis-${axis_index}`} className='relative'>
          {axes.length > 1 && (
            <button
              type='button'
              onClick={() => on_remove_axis(axis_index)}
              className={
                'absolute -top-2 -right-2 z-10 rounded-md border ' +
                'border-red-400/40 px-2 py-0.5 text-[10px] text-red-300 ' +
                'hover:bg-red-500/10'
              }
            >
              Xóa trục
            </button>
          )}
          <OptionAxisRow
            axis_index={axis_index}
            axis={axis}
            gallery_axis_index={gallery_axis_index}
            on_name_change={handle_name_change}
            on_values_change={handle_values_change}
            bump_value_images={bump_value_images}
            upload_resolver={
              gallery_upload_resolver ?
                wrapped_upload
              : null
            }
            gallery_upload_loading={gallery_upload_loading}
          />
        </div>
      ))}
      <button
        type='button'
        onClick={on_add_axis}
        className={
          'rounded-md border border-dashed border-white/20 px-3 py-2 text-sm ' +
          'text-[#94a3b8] hover:border-[#9f67ff]/50 hover:text-white'
        }
      >
        + Thêm tùy chọn (Size, Độ cứng…)
      </button>
    </div>
  )
}
