import { useState } from "react";
import SectionWrapper from "./SectionWrapper.jsx";
import { useBrands } from "../hooks/useCategories.js";

// Generate initials from brand name as fallback
function BrandLogo({ brand }) {
  const [img_error, setImgError] = useState(false);
  const image_url = brand.image_url?.trim();
  const show_image = Boolean(image_url) && !img_error;

  const initials = brand.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="group relative flex items-center justify-center h-24 rounded-xl cursor-pointer
                 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(124,58,237,0.4)]"
      style={{
        background: "rgba(15,15,26,0.5)",
        border: "1px solid rgba(30,30,46,0.8)",
      }}
    >
      <div className="flex flex-col items-center justify-center gap-2 px-2">
        {show_image ? (
          <img
            src={image_url}
            alt={brand.name}
            className="max-h-12 w-full max-w-36 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="font-display text-2xl font-black tracking-widest
                       text-[#334155] group-hover:text-[#7c3aed] transition-colors duration-300"
            style={{ filter: "none" }}
          >
            {initials}
          </span>
        )}
        <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-[#475569] group-hover:text-[#64748b] transition-colors text-center line-clamp-2">
          {brand.name}
        </span>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: "inset 0 0 20px rgba(124,58,237,0.08)" }}
      />
    </div>
  );
}

function BrandSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function BrandShowcase() {
  const { brands, loading, error } = useBrands();

  if (error) return null; // Silently fail brand showcase

  return (
    <SectionWrapper
      id="brands"
      title="Trusted Brands"
      subtitle="We partner with the best in competitive gaming"
    >
      {loading && <BrandSkeleton />}
      {!loading && brands.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
          {brands.map((brand) => (
            <BrandLogo key={brand.brand_id} brand={brand} />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}
