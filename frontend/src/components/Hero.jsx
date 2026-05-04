import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Animated crosshair cursor effect
function CrosshairCursor({ x, y }) {
  return (
    <div
      className="absolute pointer-events-none transition-all duration-100"
      style={{ left: x - 20, top: y - 20, opacity: 0.25 }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" stroke="#7c3aed" strokeWidth="1"/>
        <circle cx="20" cy="20" r="3" fill="#06b6d4"/>
        <line x1="20" y1="4" x2="20" y2="12"  stroke="#06b6d4" strokeWidth="1.5"/>
        <line x1="20" y1="28" x2="20" y2="36" stroke="#06b6d4" strokeWidth="1.5"/>
        <line x1="4"  y1="20" x2="12" y2="20" stroke="#06b6d4" strokeWidth="1.5"/>
        <line x1="28" y1="20" x2="36" y2="20" stroke="#06b6d4" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

// Floating particle
function Particle({ style }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={style}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  style: {
    width:  `${2 + Math.random() * 3}px`,
    height: `${2 + Math.random() * 3}px`,
    left:   `${Math.random() * 100}%`,
    top:    `${Math.random() * 100}%`,
    background: i % 3 === 0 ? "#7c3aed" : i % 3 === 1 ? "#06b6d4" : "#ef4444",
    opacity: 0.3 + Math.random() * 0.4,
    animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
    boxShadow: `0 0 6px 2px ${i % 3 === 0 ? "#7c3aed" : i % 3 === 1 ? "#06b6d4" : "#ef4444"}`,
  },
}));

// Animated scan line
function ScanLine() {
  return (
    <div
      className="absolute left-0 right-0 h-px pointer-events-none"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), rgba(6,182,212,0.4), transparent)",
        animation: "scanLine 6s linear infinite",
        opacity: 0.5,
      }}
    />
  );
}

export default function Hero() {
  const heroRef = useRef(null);

  // Parallax on mouse move
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      const glow = el.querySelector(".hero-glow");
      if (glow) {
        glow.style.transform = `translate(${x * 40}px, ${y * 30}px)`;
      }
    };
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden hex-bg"
      style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d0a1a 50%, #0a0f0f 100%)" }}
    >
      {/* Ambient glow blobs */}
      <div
        className="hero-glow absolute transition-transform duration-200 ease-out pointer-events-none"
        style={{
          width: "900px",
          height: "900px",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
          bottom: "10%",
          right: "10%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)",
          top: "15%",
          left: "15%",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Scan line */}
      <ScanLine />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <Particle key={p.id} style={p.style} />
      ))}

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto my-20">
        {/* Badge */}
       

        {/* Main heading */}
        <h1
          className="font-display font-black uppercase leading-none animate-fadeInUp"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 6rem)",
            animationDelay: "0.1s",
          }}
        >
          <span className="block text-white glow-purple">Aim Faster.</span>
          <span
            className="block glow-cyan"
            style={{
              background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            React Smarter.
          </span>
          <span className="block text-white" style={{ color: "#ef4444", textShadow: "0 0 30px rgba(239,68,68,0.6)" }}>
            Win More.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-8 font-body text-[#94a3b8] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-fadeInUp"
          style={{ animationDelay: "0.2s" }}
        >
          AimForge equips{" "}
          <span className="text-[#9f67ff] font-semibold">competitive FPS players</span> with
          precision-engineered gear — built for speed, accuracy, and{" "}
          <span className="text-[#22d3ee] font-semibold">zero compromise</span>.
        </p>

        {/* Stats row */}
        <div
          className="mt-10 flex flex-wrap justify-center gap-8 animate-fadeInUp"
          style={{ animationDelay: "0.3s" }}
        >
          {[
            { value: "10K+",  label: "Pro Players" },
            { value: "99.9%", label: "Click Accuracy" },
            { value: "<1ms",  label: "Response Time" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-display text-2xl font-bold text-[#7c3aed]">{value}</div>
              <div className="text-[#64748b] text-xs uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div
          className="mt-12 flex flex-wrap justify-center gap-4 animate-fadeInUp"
          style={{ animationDelay: "0.4s" }}
        >
          <Link to="/chuot" className="btn-primary" id="hero-shop-now">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Mua ngay
          </Link>
          <a href="#featured-products" className="btn-outline" id="hero-explore-gear">
            Xem sản phẩm
          </a>
        </div>

        {/* Scroll indicator */}
        <div
          className="mt-20 flex flex-col items-center gap-2 animate-fadeInUp"
          style={{ animationDelay: "0.6s" }}
        >
          <span className="text-[#334155] text-xs uppercase tracking-widest font-display">Scroll</span>
          <div className="w-px h-12 relative overflow-hidden" style={{ background: "rgba(124,58,237,0.2)" }}>
            <div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#7c3aed] to-transparent"
              style={{ height: "40%", animation: "scanLine 2s linear infinite" }}
            />
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-16 h-16 pointer-events-none`}
          style={{ opacity: 0.3 }}
        >
          <svg viewBox="0 0 64 64" fill="none">
            <path
              d={
                i === 0 ? "M4 32 L4 4 L32 4" :
                i === 1 ? "M60 32 L60 4 L32 4" :
                i === 2 ? "M4 32 L4 60 L32 60" :
                          "M60 32 L60 60 L32 60"
              }
              stroke="#7c3aed"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </section>
  );
}
