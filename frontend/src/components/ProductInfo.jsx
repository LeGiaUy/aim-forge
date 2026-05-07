import { useState } from 'react'
import PriceDisplay from './PriceDisplay.jsx'

const StarIcon = () => (
  <svg
    className='h-4 w-4'
    viewBox='0 0 24 24'
    fill='currentColor'
    aria-hidden='true'
  >
    <path d='M12 2l2.8 5.66 6.25.91-4.52 4.4 1.07 6.23L12 16.3l-5.6 2.9 1.07-6.23-4.52-4.4 6.25-.91L12 2z' />
  </svg>
)

export default function ProductInfo({
  product_data,
  selected_variant
}) {
  const [brand_logo_err, setBrandLogoErr] = useState(false)
  const [category_logo_err, setCategoryLogoErr] = useState(false)

  const brand_image_url = product_data.brand?.image_url?.trim()
  const category_image_url = product_data.category?.image_url?.trim()

  return (
    <section className='space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-7'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-display font-semibold uppercase tracking-wider text-cyan-300'>
          {brand_image_url && !brand_logo_err && (
            <img
              src={brand_image_url}
              alt=''
              className='h-5 w-5 shrink-0 object-contain'
              onError={() => setBrandLogoErr(true)}
            />
          )}
          {product_data.brand?.name || 'AimForge'}
        </span>
        <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-display uppercase tracking-wider text-[#cbd5e1]'>
          {category_image_url && !category_logo_err && (
            <img
              src={category_image_url}
              alt=''
              className='h-5 w-5 shrink-0 object-contain'
              onError={() => setCategoryLogoErr(true)}
            />
          )}
          {product_data.category?.name || 'Thiết bị gaming'}
        </span>
      </div>

      <h1 className='font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl'>
        {product_data.name}
      </h1>

      <div className='flex items-center gap-1.5 text-[#fbbf24]'>
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon key={index} />
        ))}
        <span className='ml-1 text-xs font-semibold text-[#cbd5e1]'>4.9</span>
      </div>

      <p className='max-w-[64ch] whitespace-pre-line text-sm leading-6 text-[#94a3b8]'>
        {product_data.description || 'Sản phẩm này chưa có mô tả'}
      </p>

      <PriceDisplay
        product_data={product_data}
        selected_variant={selected_variant}
      />
    </section>
  )
}
