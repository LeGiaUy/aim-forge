import { useMemo, useState } from 'react'

const ChevronLeftIcon = () => (
  <svg
    className='h-5 w-5'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    aria-hidden='true'
  >
    <path d='M15 18l-6-6 6-6' />
  </svg>
)

const ChevronRightIcon = () => (
  <svg
    className='h-5 w-5'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    aria-hidden='true'
  >
    <path d='M9 18l6-6-6-6' />
  </svg>
)

export default function ProductGallery({
  product_name,
  images,
  selected_image,
  onImageSelect
}) {
  const [touch_start_x, setTouchStartX] = useState(0)
  const [touch_end_x, setTouchEndX] = useState(0)

  const image_list = useMemo(() => {
    if (!images?.length) return []
    return images
  }, [images])

  const selected_index = useMemo(() => {
    if (!image_list.length || !selected_image) return 0
    const found_index = image_list.findIndex(
      item => item.image_url === selected_image
    )
    return found_index === -1 ? 0 : found_index
  }, [image_list, selected_image])

  const handleSwipe = direction => {
    if (!image_list.length) return

    const next_index =
      direction === 'next'
        ? (selected_index + 1) % image_list.length
        : (selected_index - 1 + image_list.length) % image_list.length

    onImageSelect(image_list[next_index].image_url)
  }

  const handleTouchEnd = () => {
    const swipe_distance = touch_start_x - touch_end_x
    if (swipe_distance > 48) handleSwipe('next')
    if (swipe_distance < -48) handleSwipe('prev')
  }

  return (
    <section className='space-y-4'>
      <div
        className='group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111122] p-3'
        onTouchStart={event => setTouchStartX(event.targetTouches[0].clientX)}
        onTouchMove={event => setTouchEndX(event.targetTouches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        <div className='relative overflow-hidden rounded-xl bg-[#090912]'>
          {selected_image ? (
            <img
              src={selected_image}
              alt={product_name}
              loading='lazy'
              className='h-[320px] w-full object-cover transition-transform duration-300 group-hover:scale-125 sm:h-[460px]'
            />
          ) : (
            <div className='flex h-[320px] w-full items-center justify-center text-sm text-[#64748b] sm:h-[460px]'>
              No image
            </div>
          )}
        </div>

        <button
          type='button'
          aria-label='Previous image'
          onClick={() => handleSwipe('prev')}
          className='absolute left-5 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition hover:border-[#9f67ff] hover:text-[#9f67ff] sm:flex'
        >
          <ChevronLeftIcon />
        </button>

        <button
          type='button'
          aria-label='Next image'
          onClick={() => handleSwipe('next')}
          className='absolute right-5 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition hover:border-[#9f67ff] hover:text-[#9f67ff] sm:flex'
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className='flex gap-3 overflow-x-auto pb-2'>
        {image_list.map(item => {
          const is_selected = item.image_url === selected_image

          return (
            <button
              key={item.image_url}
              type='button'
              aria-label='Select product image'
              onClick={() => onImageSelect(item.image_url)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                is_selected
                  ? 'border-[#9f67ff] shadow-[0_0_18px_rgba(124,58,237,0.45)]'
                  : 'border-white/10 hover:border-cyan-400/60'
              }`}
            >
              <img
                src={item.image_url}
                alt={product_name}
                loading='lazy'
                className='h-full w-full object-cover'
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
