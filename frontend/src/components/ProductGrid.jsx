import SectionWrapper from "./SectionWrapper.jsx";
import ProductCard from "./ProductCard.jsx";
import { useProducts } from "../hooks/useProducts.js";

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton rounded-xl overflow-hidden">
          <div className="h-56 w-full" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-8 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <p className="mt-4 text-[#ef4444] text-sm font-body">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 btn-outline text-xs py-2 px-4"
      >
        Thử lại
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="18" rx="2"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      <p className="mt-4 text-[#64748b] text-sm font-body">Chưa có sản phẩm.</p>
    </div>
  );
}

export default function ProductGrid() {
  const { products, loading, error } = useProducts();

  return (
    <SectionWrapper
      id="featured-products"
      title="Sản phẩm nổi bật"
      subtitle="Thiết bị hàng đầu được game thủ FPS chuyên nghiệp tin dùng"
    >
      {loading && <ProductSkeleton />}
      {error && <ErrorState message={`Không tải được sản phẩm: ${error}`} />}
      {!loading && !error && products.length === 0 && <EmptyState />}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {products.map((product, i) => (
            <ProductCard key={product.product_id} product={product} index={i} />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}
