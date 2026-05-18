import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import {
  format_price_display,
  normalize_price_input
} from '../../../utils/priceInput.js'
import {
  build_default_variant_sku,
  combo_key_from_labels,
} from '../../../utils/variantMatrixHelpers.js'

/** Một ô input — tránh rerender không cần khi chỉ các hàng khác đổi */
const MemoInput = memo(function MemoInput({
  aria_label,
  input_class_name,
  min,
  step,
  value,
  on_change_commit,
  use_thousand_separator = false,
}) {
  return (
    <input
      type='text'
      inputMode='numeric'
      aria-label={aria_label}
      min={min}
      step={step}
      value={
        use_thousand_separator ?
          format_price_display(value)
        : value
      }
      onChange={e =>
        on_change_commit(
          use_thousand_separator ?
            normalize_price_input(e.target.value)
          : e.target.value
        )
      }
      className={input_class_name}
    />
  )
})

function labels_for_variant(variant, product_options) {
  return (variant.option_selections || []).map((si, axis_i) =>
    String(product_options[axis_i]?.values[si]?.value ?? '').trim()
  )
}

export default function CreateVariantMatrixPanel({
  axes,
  product_options,
  variants,
  patch_variant_fields,
  sku_namespace = '',
}) {
  const [filter_axis, set_filter_axis] = useState('-1')
  const [filter_value, set_filter_value] = useState('')
  const [filter_sku, set_filter_sku] = useState('')
  const [selected_row_indices, set_selected_row_indices] = useState(
    () => new Set()
  )
  const visible_rows_ref = useRef([])
  const selected_row_indices_ref = useRef(selected_row_indices)

  const { register, getValues, reset, watch, setValue } = useForm({
    defaultValues: {
      bulk_price: '',
      bulk_stock: '',
    },
  })
  const bulk_price_value = watch('bulk_price')

  const enriched = useMemo(
    () =>
      variants.map((variant, row_index) => {
        const labels = labels_for_variant(variant, product_options)
        return {
          row_index,
          variant,
          labels,
          combo_key: combo_key_from_labels(labels),
        }
      }),
    [variants, product_options]
  )

  const distinct_values_axis = useCallback(
    axis_i => {
      const set_vals = new Set()
      enriched.forEach(row_item => {
        const value_label = row_item.labels[axis_i]
        if (value_label) set_vals.add(value_label)
      })
      return [...set_vals].sort()
    },
    [enriched]
  )

  const visible_rows = useMemo(() => {
    let filtered = enriched
    const sku_q = filter_sku.trim().toLowerCase()
    if (sku_q.length) {
      filtered = filtered.filter(row_item =>
        String(row_item.variant.sku ?? '')
          .toLowerCase()
          .includes(sku_q)
      )
    }
    const ai = Number(filter_axis)
    const fv = filter_value.trim()
    if (fv && !Number.isNaN(ai) && ai >= 0 && axes[ai]) {
      filtered = filtered.filter(row_item => row_item.labels[ai] === fv)
    }
    return filtered
  }, [
    enriched,
    filter_sku,
    filter_axis,
    filter_value,
    axes,
  ])

  const selected_visible_count = useMemo(() => {
    let counter = 0
    visible_rows.forEach(row_item => {
      if (selected_row_indices.has(row_item.row_index)) counter += 1
    })
    return counter
  }, [visible_rows, selected_row_indices])

  visible_rows_ref.current = visible_rows
  selected_row_indices_ref.current = selected_row_indices

  const toggle_row = useCallback(row_index => {
    set_selected_row_indices(prev_set => {
      const next_set = new Set(prev_set)
      if (next_set.has(row_index)) next_set.delete(row_index)
      else next_set.add(row_index)
      return next_set
    })
  }, [])

  const toggle_visible_all = useCallback(() => {
    const visible_rows_now = visible_rows_ref.current
    const selected_indices_now = selected_row_indices_ref.current
    const all_labels = visible_rows_now.map(row_item => row_item.row_index)
    const every_on =
      all_labels.length > 0 &&
      all_labels.every(label_index =>
        selected_indices_now.has(label_index)
      )
    set_selected_row_indices(prev_set => {
      const next_set = new Set(prev_set)
      if (every_on) {
        all_labels.forEach(label_index => next_set.delete(label_index))
      } else {
        all_labels.forEach(label_index => next_set.add(label_index))
      }
      return next_set
    })
  }, [])

  const apply_bulk_to_indices = useCallback(
    target_indices => {
      const { bulk_price, bulk_stock } = getValues()
      const price_str = String(bulk_price ?? '').trim()
      const stock_str = String(bulk_stock ?? '').trim()
      if (!price_str && stock_str === '') return
      const stock_num = stock_str === '' ? null : Number(stock_str)
      patch_variant_fields(prev_list =>
        prev_list.map((variant_item, idx) => {
          if (!target_indices.includes(idx)) return variant_item
          const next_item = { ...variant_item }
          if (price_str && !Number.isNaN(Number(price_str))) {
            next_item.price = price_str
          }
          if (stock_num !== null && Number.isFinite(stock_num) && stock_num >= 0) {
            next_item.stock = stock_num
          }
          return next_item
        })
      )
    },
    [getValues, patch_variant_fields]
  )

  const handle_apply_selected = useCallback(() => {
    const targets = visible_rows
      .filter(row_item => selected_row_indices.has(row_item.row_index))
      .map(row_item => row_item.row_index)
    if (!targets.length) return
    apply_bulk_to_indices(targets)
  }, [apply_bulk_to_indices, visible_rows, selected_row_indices])

  const handle_apply_all_visible = useCallback(() => {
    const targets = visible_rows.map(row_item => row_item.row_index)
    if (!targets.length) return
    apply_bulk_to_indices(targets)
  }, [apply_bulk_to_indices, visible_rows])

  const handle_regenerate_sku = useCallback(
    mode => {
      const indices_from_selected =
        mode === 'selected' ?
          visible_rows
            .filter(row_item =>
              selected_row_indices.has(row_item.row_index)
            )
            .map(row_item => row_item.row_index)
        : visible_rows.map(row_item => row_item.row_index)
      const target_set = new Set(indices_from_selected)
      patch_variant_fields(prev_list =>
        prev_list.map((variant_item, idx) => {
          if (!target_set.has(idx)) return variant_item
          const labels_here = labels_for_variant(
            variant_item,
            product_options
          )
          return {
            ...variant_item,
            sku: build_default_variant_sku({
              combo: labels_here,
              combo_index: idx,
              sku_namespace,
            }),
          }
        })
      )
    },
    [
      patch_variant_fields,
      product_options,
      visible_rows,
      selected_row_indices,
      sku_namespace,
    ]
  )

  const axis_filter_options = useMemo(() => {
    const ai = Number(filter_axis)
    if (Number.isNaN(ai) || ai < 0) return []
    return distinct_values_axis(ai)
  }, [filter_axis, distinct_values_axis])

  const columns = useMemo(
    () =>
      [
        {
          id: '_select',
          header: () => (
            <input
              type='checkbox'
              aria-label='Chọn các dòng hiện trong lọc'
              checked={
                visible_rows.length > 0 &&
                visible_rows.every(row_item =>
                  selected_row_indices.has(row_item.row_index)
                )
              }
              onChange={toggle_visible_all}
              className='rounded border-white/30'
            />
          ),
          cell: ({ row }) => (
            <input
              type='checkbox'
              checked={selected_row_indices.has(row.original.row_index)}
              onChange={() => toggle_row(row.original.row_index)}
              className='rounded border-white/30'
            />
          ),
          size: 36,
        },
        ...axes.map((axis_spec, axis_i) => ({
          id: `_opt_${axis_i}`,
          header: () =>
            axis_spec.name?.trim() || `Tuỳ chọn ${axis_i + 1}`,
          cell: ({ row }) => (
            <span className='whitespace-nowrap text-[#cbd5e1]'>
              {row.original.labels[axis_i] || '—'}
            </span>
          ),
          size: 120,
        })),
        {
          id: '_price',
          header: () => 'Giá bán',
          cell: ({ row }) => (
            <MemoInput
              aria_label='Giá bán'
              input_class_name='admin-input w-28'
              min='0'
              step='1'
              value={
                row.original.variant.price === undefined ||
                row.original.variant.price === null ||
                row.original.variant.price === '' ?
                  ''
                : row.original.variant.price
              }
              use_thousand_separator
              on_change_commit={raw =>
                patch_variant_fields(prev_list =>
                  prev_list.map((v_item, li) =>
                    li === row.original.row_index ?
                      { ...v_item, price: raw }
                    : v_item
                  )
                )
              }
            />
          ),
          size: 124,
        },
        {
          id: '_stock',
          header: () => 'Tồn',
          cell: ({ row }) => (
            <MemoInput
              aria_label='Tồn'
              input_class_name='admin-input w-20'
              min='0'
              step='1'
              value={
                row.original.variant.stock === undefined ||
                row.original.variant.stock === null ||
                row.original.variant.stock === '' ?
                  ''
                : row.original.variant.stock
              }
              on_change_commit={raw =>
                patch_variant_fields(prev_list =>
                  prev_list.map((v_item, li) =>
                    li === row.original.row_index ?
                      { ...v_item, stock: raw }
                    : v_item
                  )
                )
              }
            />
          ),
          size: 88,
        },
        {
          id: '_sku',
          header: () => 'SKU',
          cell: ({ row }) => (
            <input
              type='text'
              value={row.original.variant.sku ?? ''}
              onChange={e =>
                patch_variant_fields(prev_list =>
                  prev_list.map((v_item, li) =>
                    li === row.original.row_index ?
                      { ...v_item, sku: e.target.value }
                    : v_item
                  )
                )
              }
              className='admin-input min-w-[8rem]'
            />
          ),
          size: 160,
        },
      ].filter(Boolean),
    [axes, toggle_visible_all, toggle_row, patch_variant_fields]
  )

  const table_instance = useReactTable({
    data: visible_rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: row_data => String(row_data.row_index),
  })

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4'>
        <div>
          <label className='admin-label mb-1 block'>Giá bán</label>
          <input
            type='text'
            inputMode='numeric'
            {...register('bulk_price')}
            value={format_price_display(bulk_price_value)}
            onChange={event => {
              setValue(
                'bulk_price',
                normalize_price_input(event.target.value),
                { shouldDirty: true }
              )
            }}
            className='admin-input w-32'
          />
        </div>
        <div>
          <label className='admin-label mb-1 block'>Tồn</label>
          <input
            type='number'
            min='0'
            {...register('bulk_stock')}
            className='admin-input w-24'
          />
        </div>
        <button
          type='button'
          onClick={() => {
            reset({ bulk_price: '', bulk_stock: '' })
          }}
          className='admin-btn-ghost text-xs'
        >
          Reset ô hàng loạt
        </button>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-xs uppercase tracking-wide text-[#64748b]'>
          Bulk
        </span>
        <button
          type='button'
          disabled={selected_visible_count === 0}
          onClick={handle_apply_selected}
          className='rounded-md border border-violet-500/40 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/10 disabled:opacity-35'
        >
          Áp dụng vào đã chọn ({selected_visible_count})
        </button>
        <button
          type='button'
          disabled={!visible_rows.length}
          onClick={handle_apply_all_visible}
          className='rounded-md border border-white/15 px-3 py-1.5 text-xs text-[#cbd5e1] hover:border-[#9f67ff]'
        >
          Áp dụng vào đang hiện ({visible_rows.length})
        </button>
        <button
          type='button'
          disabled={
            visible_rows.filter(row_item =>
              selected_row_indices.has(row_item.row_index)
            ).length === 0
          }
          onClick={() => handle_regenerate_sku('selected')}
          className='rounded-md border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-35'
        >
          Sinh SKU — đã chọn
        </button>
        <button
          type='button'
          disabled={!visible_rows.length}
          onClick={() => handle_regenerate_sku('visible')}
          className='rounded-md border border-cyan-500/20 px-3 py-1.5 text-xs text-cyan-100/90 hover:bg-cyan-500/10 disabled:opacity-35'
        >
          Sinh SKU — đang hiện
        </button>
      </div>

      <div className='flex flex-wrap gap-4 rounded-xl border border-white/10 p-4'>
        <div className='min-w-[10rem] flex-1'>
          <label className='admin-label mb-1 block'>
            SKU chứa
          </label>
          <input
            type='search'
            value={filter_sku}
            onChange={e => set_filter_sku(e.target.value)}
            placeholder='Lọc…'
            className='admin-input w-full'
          />
        </div>
        <div className='min-w-[8rem]'>
          <label className='admin-label mb-1 block'>Lọc trục</label>
          <select
            value={filter_axis}
            onChange={e => {
              set_filter_axis(e.target.value)
              set_filter_value('')
            }}
            className='admin-select w-full'
          >
            <option value='-1'>— Mọi trục —</option>
            {axes.map((axis_spec, axis_i) => (
              <option key={`fa-${axis_i}`} value={String(axis_i)}>
                {axis_spec.name?.trim() || `Trục ${axis_i + 1}`}
              </option>
            ))}
          </select>
        </div>
        <div className='min-w-[8rem] flex-1'>
          <label className='admin-label mb-1 block'>Giá trị</label>
          <select
            value={filter_value}
            disabled={filter_axis === '-1'}
            onChange={e => set_filter_value(e.target.value)}
            className='admin-select w-full'
          >
            <option value=''>— Tất cả —</option>
            {axis_filter_options.map(one_value_label => (
              <option key={one_value_label} value={one_value_label}>
                {one_value_label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='overflow-x-auto rounded-xl border border-white/10'>
        <table className='w-full min-w-[720px] text-sm'>
          <thead className='border-b border-white/10 bg-white/5'>
            {table_instance.getHeaderGroups().map(header_row => (
              <tr key={header_row.id}>
                {header_row.headers.map(head_cell => (
                  <th
                    key={head_cell.id}
                    className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#94a3b8]'
                    style={{
                      width: head_cell.column.getSize(),
                    }}
                  >
                    {flexRender(
                      head_cell.column.columnDef.header,
                      head_cell.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className='divide-y divide-white/5'>
            {table_instance.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className='px-4 py-8 text-center text-[#64748b]'
                >
                  Chưa có biến thể — thêm giá trị cho tùy chọn và kiểm tra mỗi
                  trục có ít nhất một chip.
                </td>
              </tr>
            ) : (
              table_instance.getRowModel().rows.map(row_obj => (
                <tr key={row_obj.id} className='bg-white/[0.015]'>
                  {row_obj.getVisibleCells().map(cell_el => (
                    <td key={cell_el.id} className='px-3 py-2 align-middle'>
                      {flexRender(
                        cell_el.column.columnDef.cell,
                        cell_el.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='flex justify-between gap-4 text-[11px] text-[#64748b]'>
        <span>
          {variants.length} biến thể tổng · {visible_rows.length} hiển thị
        </span>
      </div>
    </div>
  )
}
