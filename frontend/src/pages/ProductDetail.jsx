import { Link, useParams } from 'react-router-dom'
import AddToCart from '../components/AddToCart.jsx'
import ProductGallery from '../components/ProductGallery.jsx'
import ProductInfo from '../components/ProductInfo.jsx'
import ProductTabs from '../components/ProductTabs.jsx'
import RelatedProducts from '../components/RelatedProducts.jsx'
import VariantSelector from '../components/VariantSelector.jsx'
import { useProductDetail } from '../hooks/useProductDetail.js'

function LoadingState() {
  return (
    <section className='space-y-6'>
      <div
        className={
          'skeleton mx-auto aspect-square w-full max-w-xs ' +
          'rounded-2xl sm:max-w-sm md:max-w-md lg:max-w-lg'
        }
      />
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <div className='skeleton h-52 w-full rounded-2xl' />
        <div className='skeleton h-52 w-full rounded-2xl' />
      </div>
    </section>
  )
}

function ErrorState({ message }) {
  return (
    <section className='rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center'>
      <h2 className='font-display text-lg font-semibold uppercase tracking-wider text-red-200'>
        Không thể tải sản phẩm
      </h2>
      <p className='mt-2 text-sm text-red-300'>{message}</p>
      <Link
        to='/'
        className='mt-4 inline-flex rounded-lg border border-red-300/40 px-4 py-2 text-xs font-display uppercase tracking-wider text-red-200 transition hover:bg-red-500/20'
      >
        Quay về trang chủ
      </Link>
    </section>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const {
    product_data,
    related_products,
    selected_variant,
    selected_image,
    loading_state,
    error_message,
    setSelectedVariant,
    setSelectedImage
  } = useProductDetail(id)

  const gallery_images = selected_variant?.images || []

  return (
    <main className='mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8'>
      <Link
        to='/'
        className='text-sm font-body text-[#64748b] transition-colors hover:text-[#9f67ff]'
      >
        ← Về trang chủ
      </Link>

      <div className='mt-6 space-y-10'>
        {loading_state && <LoadingState />}
        {!loading_state && error_message && <ErrorState message={error_message} />}

        {!loading_state && !error_message && product_data && (
          <>
            <section className='grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]'>
              <ProductGallery
                product_name={product_data.name}
                images={gallery_images}
                selected_image={selected_image}
                onImageSelect={setSelectedImage}
              />

              <div className='space-y-5'>
                <ProductInfo
                  product_data={product_data}
                  selected_variant={selected_variant}
                />

                <VariantSelector
                  product_options={product_data.product_options}
                  variants={product_data.variants}
                  selected_variant={selected_variant}
                  onVariantChange={setSelectedVariant}
                />

                <AddToCart
                  key={selected_variant?.variant_id || 'cart-default'}
                  selected_variant={selected_variant}
                />
              </div>
            </section>

            <ProductTabs
              description={product_data.description}
              specs={product_data.specs}
            />

            <RelatedProducts products={related_products} />
          </>
        )}
      </div>
    </main>
  )
}
