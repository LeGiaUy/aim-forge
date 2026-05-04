import { useState } from "react";
import { Link } from "react-router-dom";
import SectionWrapper from "./SectionWrapper.jsx";
import { useCategories } from "../hooks/useCategories.js";

// Icon map for known category names
const CATEGORY_ICONS = {
  "Gaming Mouse": (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
      <rect x="12" y="8" width="24" height="32" rx="12" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="8" x2="24" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="30" r="2" fill="currentColor"/>
    </svg>
  ),
  "Mechanical Keyboard": (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
      <rect x="4" y="14" width="40" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
      {[12,20,28,36].map(x => <rect key={x} x={x} y="20" width="5" height="5" rx="1" fill="currentColor" opacity="0.6"/>)}
      {[10,18,26,34].map(x => <rect key={x} x={x} y="28" width="5" height="4" rx="1" fill="currentColor" opacity="0.6"/>)}
    </svg>
  ),
  "Gaming Headset": (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
      <path d="M8 24C8 15.163 15.163 8 24 8s16 7.163 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="4"  y="22" width="8" height="12" rx="4" stroke="currentColor" strokeWidth="2"/>
      <rect x="36" y="22" width="8" height="12" rx="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  "Mousepad": (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
      <rect x="4" y="12" width="40" height="26" rx="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="14" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "Controller": (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" aria-hidden="true">
      <path d="M12 20C12 14 16 10 24 10s12 4 12 10L32 36H16L12 20Z" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="19" y1="19" x2="19" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="30" cy="22" r="2" fill="currentColor"/>
      <circle cx="27" cy="25" r="1.5" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
};

const CATEGORY_COLORS = [
  { text: "#9f67ff", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.3)" },
  { text: "#22d3ee", bg: "rgba(6,182,212,0.1)",  border: "rgba(6,182,212,0.3)"  },
  { text: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)"  },
  { text: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)" },
  { text: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)"  },
];

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-36 w-full" />
      ))}
    </div>
  );
}

function CategoryCard({ category, index }) {
  const [img_error, setImgError] = useState(false);
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const icon  = CATEGORY_ICONS[category.name] || CATEGORY_ICONS["Controller"];
  const image_url = category.image_url?.trim();
  const show_image = Boolean(image_url) && !img_error;

  return (
    <Link
      to={`/shop?category=${category.category_id}`}
      className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-xl cursor-pointer
                 transition-all duration-300 hover:-translate-y-2 animate-gridFade"
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        animationDelay: `${index * 0.08}s`,
      }}
      aria-label={`Xem danh mục ${category.name}`}
    >
      <div
        className="flex h-16 w-16 items-center justify-center transition-all duration-300 group-hover:scale-110"
        style={{ color: color.text, filter: `drop-shadow(0 0 8px ${color.text}80)` }}
      >
        {show_image ? (
          <img
            src={image_url}
            alt={category.name}
            className="max-h-full max-w-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          icon
        )}
      </div>
      <span
        className="font-display text-xs font-semibold uppercase tracking-widest text-center"
        style={{ color: color.text }}
      >
        {category.name}
      </span>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 30px ${color.text}15` }}
      />
    </Link>
  );
}

export default function CategoryGrid() {
  const { categories, loading, error } = useCategories();

  return (
    <SectionWrapper
      id="categories"
      title="Mua theo danh mục"
      subtitle="Chọn gear phù hợp phong cách chơi của bạn"
    >
      {loading && <CategorySkeleton />}
      {error && (
        <p className="text-[#ef4444] text-sm font-body">
          Không tải được danh mục: {error}
        </p>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
          {categories.map((cat, i) => (
            <div key={cat.category_id} className="relative">
              <CategoryCard category={cat} index={i} />
            </div>
          ))}
          {/* Fallback static cards if API returns fewer than 5 */}
          {categories.length === 0 && (
            <p className="col-span-full text-[#64748b] text-sm">Chưa có danh mục.</p>
          )}
        </div>
      )}
    </SectionWrapper>
  );
}
