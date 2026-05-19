import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { vi } from 'date-fns/locale'
import 'react-day-picker/style.css'
import {
  display_date_vi,
  format_ymd,
  parse_ymd,
} from '../../utils/adminDate.js'

const CalendarIcon = () => (
  <svg
    className='h-4 w-4'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    aria-hidden='true'
  >
    <path d='M8 2v4M16 2v4M4 9h16M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' />
  </svg>
)

/**
 * DatePicker admin — giá trị YYYY-MM-DD
 */
export default function AdminDatePicker({
  label_text,
  value = '',
  on_change,
  placeholder = 'Chọn ngày',
  min,
  max,
  class_name = '',
  id: field_id_prop,
  clearable = true,
}) {
  const auto_id = useId()
  const field_id = field_id_prop || auto_id
  const root_ref = useRef(null)
  const input_ref = useRef(null)
  const popover_ref = useRef(null)
  const [open_state, setOpenState] = useState(false)
  const [popover_position, setPopoverPosition] = useState({
    top: 0,
    left: 0
  })

  const selected_date = parse_ymd(value)
  const min_date = parse_ymd(min)
  const max_date = parse_ymd(max)

  const disabled_rules = {}
  if (min_date) disabled_rules.before = min_date
  if (max_date) disabled_rules.after = max_date

  const updatePopoverPosition = () => {
    const input_element = input_ref.current
    if (!input_element) return

    const input_rect = input_element.getBoundingClientRect()
    setPopoverPosition({
      top: input_rect.bottom + 8,
      left: input_rect.left
    })
  }

  useEffect(() => {
    if (!open_state) return undefined

    updatePopoverPosition()

    const handle_reposition = () => {
      updatePopoverPosition()
    }

    window.addEventListener('resize', handle_reposition)
    window.addEventListener('scroll', handle_reposition, true)

    const handle_click_outside = event => {
      const click_target = event.target
      if (root_ref.current?.contains(click_target)) return
      if (popover_ref.current?.contains(click_target)) return
      setOpenState(false)
    }

    document.addEventListener('mousedown', handle_click_outside)
    return () => {
      window.removeEventListener('resize', handle_reposition)
      window.removeEventListener('scroll', handle_reposition, true)
      document.removeEventListener('mousedown', handle_click_outside)
    }
  }, [open_state])

  const handle_select = date_value => {
    if (!date_value) {
      on_change('')
      setOpenState(false)
      return
    }
    on_change(format_ymd(date_value))
    setOpenState(false)
  }

  const handle_clear = event => {
    event.stopPropagation()
    on_change('')
    setOpenState(false)
  }

  return (
    <div ref={root_ref} className={`relative ${class_name}`}>
      {label_text ? (
        <label
          htmlFor={field_id}
          className='admin-label mb-1 block'
        >
          {label_text}
        </label>
      ) : null}

      <div className='relative'>
        <input
          ref={input_ref}
          id={field_id}
          type='text'
          readOnly
          value={value ? display_date_vi(value) : ''}
          placeholder={placeholder}
          onClick={() => setOpenState(prev => !prev)}
          className='admin-input w-full cursor-pointer pr-16'
          aria-haspopup='dialog'
          aria-expanded={open_state}
        />

        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-2'>
          {clearable && value ? (
            <button
              type='button'
              tabIndex={-1}
              onClick={handle_clear}
              className='pointer-events-auto rounded p-1 text-[#94a3b8] hover:text-white'
              aria-label='Xóa ngày'
            >
              ×
            </button>
          ) : null}
          <span className='text-[#94a3b8]'>
            <CalendarIcon />
          </span>
        </div>

        {open_state && typeof document !== 'undefined' ?
          createPortal(
            <div
              ref={popover_ref}
              className='admin-day-picker-popover admin-day-picker-popover--fixed'
              style={{
                top: popover_position.top,
                left: popover_position.left
              }}
              role='dialog'
              aria-label={label_text || 'Chọn ngày'}
            >
              <DayPicker
                mode='single'
                selected={selected_date}
                onSelect={handle_select}
                locale={vi}
                disabled={
                  Object.keys(disabled_rules).length ?
                    disabled_rules
                  : undefined
                }
                className='admin-day-picker'
              />
            </div>,
            document.body
          )
        : null}
      </div>
    </div>
  )
}
