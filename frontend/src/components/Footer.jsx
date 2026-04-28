import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-[#1e1e2e] bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="AimForge Home">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="10" stroke="#7c3aed" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="4" fill="#7c3aed"/>
                <line x1="14" y1="2" x2="14" y2="8"  stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
                <line x1="14" y1="20" x2="14" y2="26" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
                <line x1="2"  y1="14" x2="8"  y2="14" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
                <line x1="20" y1="14" x2="26" y2="14" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-display text-lg font-bold tracking-widest uppercase text-white">
                Aim<span className="text-[#7c3aed]">Forge</span>
              </span>
            </Link>
            <p className="text-[#64748b] text-sm font-body leading-relaxed">
              Precision gaming gear for competitive FPS players. Built for speed, accuracy, and victory.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Shop</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {["Gaming Mice", "Keyboards", "Headsets", "Mousepads", "Bundles"].map((item) => (
                <li key={item}>
                  <Link
                    to="/shop"
                    className="text-[#64748b] hover:text-[#9f67ff] text-sm font-body transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Company</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {["About Us", "Careers", "Pro Players", "Sponsorship", "Press"].map((item) => (
                <li key={item}>
                  <Link
                    to="/"
                    className="text-[#64748b] hover:text-[#9f67ff] text-sm font-body transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Support</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {["Help Center", "Shipping", "Returns", "Warranty", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    to="/"
                    className="text-[#64748b] hover:text-[#9f67ff] text-sm font-body transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-[#1e1e2e] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#334155] text-xs font-body">
            © 2026 AimForge. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <Link
                key={item}
                to="/"
                className="text-[#334155] hover:text-[#64748b] text-xs font-body transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
