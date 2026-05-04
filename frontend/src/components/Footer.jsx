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
              Phụ kiện gaming chính xác cho game thủ FPS cạnh tranh — tốc độ, độ chính xác và chiến thắng.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Cửa hàng</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {[
                { label: "Chuột gaming", to: "/chuot" },
                { label: "Bàn phím", to: "/ban-phim" },
                { label: "Lót chuột", to: "/lot-chuot" },
                { label: "Phụ kiện", to: "/phu-kien" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[#64748b] hover:text-[#9f67ff] text-sm font-body transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Công ty</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {["Giới thiệu", "Tuyển dụng", "Đội Pro", "Tài trợ", "Báo chí"].map((item) => (
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
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Hỗ trợ</h4>
            <ul className="space-y-2.5 list-none m-0 p-0">
              {["Trợ giúp", "Vận chuyển", "Đổi trả", "Bảo hành", "Liên hệ"].map((item) => (
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
            © 2026 AimForge. Bảo lưu mọi quyền.
          </p>
          <div className="flex items-center gap-6">
            {["Quyền riêng tư", "Điều khoản", "Cookie"].map((item) => (
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
