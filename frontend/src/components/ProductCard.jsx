import { useState } from "react";
import { Link } from "react-router-dom";

// Add-to-cart icon
const CartPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);

// Eye icon
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Fallback placeholder when no image
function ImageFallback({ name }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#14141f]">
      <div className="text-center">
        <div className="text-[#334155] text-4xl mb-2">
          <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto">
            <rect x="6" y="10" width="36" height="28" rx="4" stroke="#334155" strokeWidth="2"/>
            <circle cx="17" cy="22" r="4" stroke="#334155" strokeWidth="2"/>
            <path d="M6 34l8-8 6 6 6-8 16 14" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-[#1e293b] text-xs font-display uppercase tracking-wider">
          {name?.slice(0, 12)}
        </span>
      </div>
    </div>
  );
}

export default function ProductCard({ product, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded]       = useState(false);

  const {
    product_id,
    name,
    brand,
    min_price,
    lowest_price,
    representative_variant
  } = product;
  const display_price = min_price ?? lowest_price
  const imageUrl = representative_variant?.main_image?.image_url;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    // TODO: dispatch to cart store/context
  };

  return (
    <article
      className="group relative glass-card overflow-hidden cursor-pointer
                 transition-all duration-300 hover:-translate-y-2
                 hover:border-[rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]
                 animate-gridFade"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* Image container */}
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

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />

          {/* Quick view button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display font-semibold uppercase tracking-wider text-white"
              style={{ background: "rgba(10,10,15,0.85)", border: "1px solid rgba(124,58,237,0.4)" }}
            >
              <EyeIcon /> Quick View
            </span>
          </div>

          {/* Brand badge */}
          {brand && (
            <div
              className="absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-display font-bold uppercase tracking-wider"
              style={{ background: "rgba(10,10,15,0.85)", color: "#9f67ff", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              {brand.name}
            </div>
          )}

          {/* In-stock indicator */}
          {representative_variant?.stock > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-display font-semibold uppercase tracking-wider">
                In Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Card body */}
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

        {/* Price + CTA */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <span className="font-display text-xl font-bold text-[#7c3aed]">
              {display_price !== null && display_price !== undefined
                ? `$${Number(display_price).toFixed(2)}`
                : "—"}
            </span>
          </div>

          <button
            id={`add-to-cart-${product_id}`}
            onClick={handleAddToCart}
            aria-label={`Add ${name} to cart`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display font-semibold
                        uppercase tracking-wider transition-all duration-200 cursor-pointer
                        ${added
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-[#7c3aed]/10 text-[#9f67ff] border border-[#7c3aed]/30 hover:bg-[#7c3aed]/20 hover:border-[#7c3aed]/60"
                        }`}
          >
            {added ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Added
              </>
            ) : (
              <>
                <CartPlusIcon /> Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom neon accent line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500"
        style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }}
      />
    </article>
  );
}
