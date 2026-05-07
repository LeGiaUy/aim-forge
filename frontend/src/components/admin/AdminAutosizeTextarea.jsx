import { useCallback, useLayoutEffect, useRef } from 'react'

const DEFAULT_MAX_H = 448

/**
 * Textarea admin: tự chỉnh chiều cao theo nội dung (tối đa max_height_px)
 */
export default function AdminAutosizeTextarea({
  value,
  onChange,
  className = '',
  min_rows = 2,
  max_height_px = DEFAULT_MAX_H,
  ...rest
}) {
  const ref = useRef(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    const cs = window.getComputedStyle(el)
    const line_h = parseFloat(cs.lineHeight) || 21
    const pad_y = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const border_y =
      parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    const min_h = line_h * min_rows + pad_y + border_y

    el.style.height = '0px'
    const content_h = el.scrollHeight
    const capped = Math.min(Math.max(content_h, min_h), max_height_px)
    el.style.height = `${capped}px`
    el.style.overflowY = content_h > max_height_px ? 'auto' : 'hidden'
  }, [min_rows, max_height_px])

  useLayoutEffect(() => {
    resize()
  }, [value, resize])

  const handle_change = useCallback(
    e => {
      onChange(e)
      requestAnimationFrame(resize)
    },
    [onChange, resize]
  )

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={min_rows}
      value={value}
      onChange={handle_change}
      onInput={resize}
      className={`admin-input admin-textarea-autosize ${className}`.trim()}
    />
  )
}
