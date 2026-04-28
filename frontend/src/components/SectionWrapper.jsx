// Reusable section wrapper with title, accent bar, and optional subtitle
export default function SectionWrapper({ id, title, subtitle, children, className = "" }) {
  return (
    <section id={id} className={`py-20 px-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="mb-12">
            {title && (
              <h2 className="section-accent font-display text-3xl md:text-4xl font-bold text-white uppercase tracking-wide">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 text-[#64748b] font-body text-base max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
