import { Link } from 'react-router-dom'
import { formatVnd } from '../utils/currency.js'

export default function RelatedProducts({ products }) {
  if (!products?.length) return null

  return (
    <section className='space-y-4'>
      <h2 className='font-display text-xl font-bold uppercase tracking-wider text-white'>
        Related products
      </h2>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {products.map(item => (
          <Link
            key={item.product_id}
            to={`/product/${item.product_id}`}
            className='group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]'
          >
            <div className='h-44 overflow-hidden bg-[#0b0b16]'>
              <img
                src={item.representative_variant?.main_image?.image_url || ''}
                alt={item.name}
                loading='lazy'
                className='h-full w-full object-cover transition duration-300 group-hover:scale-110'
              />
            </div>

            <div className='space-y-2 p-4'>
              <p className='font-display text-xs uppercase tracking-wider text-cyan-300'>
                {item.brand?.name || 'AimForge'}
              </p>
              <h3 className='line-clamp-2 font-display text-sm font-semibold uppercase text-white'>
                {item.name}
              </h3>
              <p className='font-display text-lg font-bold text-[#9f67ff]'>
                {formatVnd(item.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
