import { Link } from "react-router-dom";

export default function CTABanner() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.04) 50%, rgba(124,58,237,0.06) 100%)",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 65%)",
          top: "50%", left: "30%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)",
          bottom: "0%", right: "10%",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2
          className="font-display font-black uppercase tracking-wider text-4xl md:text-5xl leading-tight"
        >
          <span className="text-white">Nâng cấp</span>{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            aim
          </span>{" "}
          <span className="text-white">của bạn hôm nay</span>
        </h2>

        <p className="mt-5 text-[#94a3b8] text-lg font-body max-w-lg mx-auto leading-relaxed">
          Cùng hàng nghìn game thủ cạnh tranh tin chọn AimForge cho bộ gear của họ.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/chuot" className="btn-primary" id="cta-shop-now">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Mua ngay
          </Link>
          <a href="#featured-products" className="btn-outline" id="cta-browse-gear">
            Xem thiết bị
          </a>
        </div>
      </div>
    </section>
  );
}
