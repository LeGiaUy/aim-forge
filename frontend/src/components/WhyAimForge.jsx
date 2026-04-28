import SectionWrapper from "./SectionWrapper.jsx";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2"/>
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2"/>
        <circle cx="24" cy="24" r="2" fill="currentColor"/>
        <line x1="24" y1="4" x2="24" y2="10"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="38" x2="24" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4"  y1="24" x2="10" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Pro Esports Grade",
    description: "Every product is tested and validated by professional FPS players at tournament level.",
    color: "#7c3aed",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <path d="M6 24L24 6L42 24L24 42L6 24Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M18 24L24 18L30 24L24 30L18 24Z" fill="currentColor" opacity="0.3"/>
        <circle cx="24" cy="24" r="3" fill="currentColor"/>
      </svg>
    ),
    title: "Sub-1ms Response",
    description: "Lightning-fast polling rates and zero-latency wireless for when every millisecond counts.",
    color: "#06b6d4",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 24L22 30L34 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "FPS Optimized",
    description: "Specifically engineered for first-person shooters — from sensor precision to ergonomic design.",
    color: "#ef4444",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <path d="M24 4L30 16L44 18L34 28L36 42L24 36L12 42L14 28L4 18L18 16L24 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M24 14L27 20L34 21L29 26L30 33L24 30L18 33L19 26L14 21L21 20L24 14Z" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
    title: "Trusted by Champions",
    description: "Used by top-ranked competitive players in Valorant, CS2, Overwatch, and Apex Legends.",
    color: "#eab308",
  },
];

export default function WhyAimForge() {
  return (
    <SectionWrapper
      id="why-aimforge"
      title="Why AimForge?"
      subtitle="Built different — for players who refuse to lose"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className="group relative p-6 rounded-xl cursor-default
                       transition-all duration-300 hover:-translate-y-2 animate-gridFade"
            style={{
              background: `rgba(${feature.color === "#7c3aed" ? "124,58,237" : feature.color === "#06b6d4" ? "6,182,212" : feature.color === "#ef4444" ? "239,68,68" : "234,179,8"},0.05)`,
              border: `1px solid rgba(${feature.color === "#7c3aed" ? "124,58,237" : feature.color === "#06b6d4" ? "6,182,212" : feature.color === "#ef4444" ? "239,68,68" : "234,179,8"},0.15)`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {/* Icon */}
            <div
              className="mb-4 transition-transform duration-300 group-hover:scale-110"
              style={{
                color: feature.color,
                filter: `drop-shadow(0 0 8px ${feature.color}60)`,
              }}
            >
              {feature.icon}
            </div>

            {/* Title */}
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-2">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="font-body text-sm text-[#64748b] leading-relaxed">
              {feature.description}
            </p>

            {/* Hover glow */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ boxShadow: `inset 0 0 30px ${feature.color}10` }}
            />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
