import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVnd } from '../utils/currency.js'

function ImageFallback({ name }) {
  return (
    <div className='w-full h-full flex items-center justify-center bg-[#14141f]'>
      <div className='text-center'>
        <div className='text-[#334155] text-4xl mb-2'>
          <svg viewBox='0 0 48 48' fill='none' className='w-12 h-12 mx-auto'>
            <rect x='6' y='10' width='36' height='28' rx='4' stroke='#334155' strokeWidth='2' />
            <circle cx='17' cy='22' r='4' stroke='#334155' strokeWidth='2' />
            <path d='M6 34l8-8 6 6 6-8 16 14' stroke='#334155' strokeWidth='2' strokeLinecap='round' />
          </svg>
        </div>
        <span className='text-[#1e293b] text-xs font-display uppercase tracking-wider'>
          {name?.slice(0, 12)}
        </span>
      </div>
    </div>
  )
}

/** Card sản phẩm grid: hiển thị giá từ API (final_price, discount) — không tin giá frontend */
export default function ProductCard({ product, index = 0 }) {
  const {
    product_id,
    name,
    brand,
    representative_variant
  } = product
  const [imgError, setImgError] = useState(false)
  const [brand_badge_img_failed, setBrandBadgeImgFailed] = useState(false)

  useEffect(() => {
    setBrandBadgeImgFailed(false)
  }, [product_id])

  const original_price = product.price ?? null
  const final_price =
    product.final_price ?? original_price
  const discount_amount = product.discount_amount ?? null
  const has_active_discount =
    discount_amount != null &&
    discount_amount > 0 &&
    final_price != null &&
    original_price != null &&
    final_price < original_price

  const imageUrl = representative_variant?.main_image?.image_url
  const variant_list = Array.isArray(product.variants) ? product.variants : []
  const total_stock_value = Number(product.total_stock)
  const fallback_stock_value = Number(product.stock)
  const has_any_in_stock =
    typeof product.in_stock === 'boolean'
      ? product.in_stock
      : Number.isFinite(total_stock_value)
        ? total_stock_value > 0
        : variant_list.length
          ? variant_list.some(variant_item => (variant_item?.stock || 0) > 0)
          : Number.isFinite(fallback_stock_value)
            ? fallback_stock_value > 0
            : (representative_variant?.stock || 0) > 0

  return (
    <article
      className="group relative glass-card overflow-hidden cursor-pointer
                 transition-all duration-300 hover:-translate-y-2
                 hover:border-[rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]
                 animate-gridFade"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <Link to={`/product/${product_id}`} aria-label={`View ${name}`}>
        <div className="relative h-56 overflow-hidden bg-[#0f0f1a]">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <ImageFallback name={name} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />

          {brand && (
            <div
              className='absolute left-3 top-3 flex max-w-[min(11rem,calc(100%-5rem))] items-center gap-1.5 rounded px-2 py-1 text-[10px] font-display font-bold uppercase tracking-wider'
              style={{ background: 'rgba(10,10,15,0.85)', color: '#9f67ff', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              {brand.image_url && !brand_badge_img_failed && (
                <img
                  src={brand.image_url}
                  alt=''
                  className='h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5'
                  onError={() => setBrandBadgeImgFailed(true)}
                />
              )}
              <span className='min-w-0 truncate'>{brand.name}</span>
            </div>
          )}

          <div className='absolute top-3 right-3 flex items-center gap-1.5'>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                has_any_in_stock ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span
              className={`text-[10px] font-display font-semibold uppercase tracking-wider ${
                has_any_in_stock ? 'text-emerald-400' : 'text-red-300'
              }`}
            >
              {has_any_in_stock ? 'Còn hàng' : 'Hết hàng'}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${product_id}`} className="block">
          <h3
            className="font-display font-semibold text-sm uppercase tracking-wide text-[#e2e8f0]
                       group-hover:text-[#9f67ff] transition-colors truncate"
          >
            {name}
          </h3>
        </Link>

        {brand && (
          <p className="mt-1 text-[#64748b] text-xs font-body">{brand.name}</p>
        )}

        <div className="mt-3 flex items-end gap-2">
          <div className="min-w-0 flex-1">
            {has_active_discount ? (
              <div className="flex min-h-[50px] flex-col justify-end gap-0.5">
                <div className="flex items-end gap-2">
                  <span className="font-display text-xl font-bold text-[#06b6d4]">
                    {formatVnd(final_price)}
                  </span>
                  <span className="pb-0.5 font-display text-sm text-[#64748b] line-through">
                    {formatVnd(original_price)}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  Tiết kiệm {formatVnd(Math.round(discount_amount))}
                </span>
              </div>
            ) : (
              <div className="flex min-h-[32px] flex-col justify-end">
                <span className="font-display text-xl font-bold text-[#7c3aed]">
                  {final_price !== null && final_price !== undefined
                    ? formatVnd(final_price)
                    : '—'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500"
        style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
      />
    </article>
  )
}
