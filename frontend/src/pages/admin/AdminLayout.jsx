import { Link, Outlet, useLocation } from 'react-router-dom'
import { AdminToastProvider } from '../../components/admin/AdminUi.jsx'

const NAV_ITEMS = [
  { label: 'Tổng quan', path: '/admin/dashboard' },
  { label: 'Thương hiệu', path: '/admin/brands' },
  { label: 'Danh mục', path: '/admin/categories' },
  { label: 'Thuộc tính', path: '/admin/attributes' },
  { label: 'Sản phẩm', path: '/admin/products' },
  { label: 'Đơn hàng', path: '/admin/orders' },
  { label: 'Người dùng', path: '/admin/users' }
]

export default function AdminLayout() {
  const location = useLocation()

  return (
    <AdminToastProvider>
      <div className='flex min-h-screen flex-col bg-[#07071a]'>
        {/* ─── Admin Topbar ─── */}
        <header className='sticky top-0 z-50 border-b border-white/10 bg-[#0d0d1a]/90 backdrop-blur-md'>
          <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3'>
            <div className='flex items-center gap-6'>
              <Link to='/admin/dashboard' className='flex items-center gap-2'>
                <span className='text-lg font-bold tracking-tight'>
                  <span className='text-[#9f67ff]'>Aim</span>
                  <span className='text-white'>Forge</span>
                </span>
                <span className='rounded-md bg-[#7c3aed]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#c4b5fd]'>
                  Quản trị
                </span>
              </Link>

              <nav className='hidden items-center gap-1 sm:flex'>
                {NAV_ITEMS.map(item => {
                  const is_active = location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        is_active
                          ? 'bg-white/10 text-white'
                          : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            <Link
              to='/'
              className='text-xs text-[#64748b] transition hover:text-white'
            >
              ← Về trang mua sắm
            </Link>
          </div>
        </header>

        {/* ─── Content ─── */}
        <main className='flex-1'>
          <Outlet />
        </main>
      </div>
    </AdminToastProvider>
  )
}
