import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

// Crosshair SVG icon
const CrosshairIcon = () => (
  <svg width='28' height='28' viewBox='0 0 28 28' fill='none' aria-hidden='true'>
    <circle cx='14' cy='14' r='10' stroke='#7c3aed' strokeWidth='1.5' />
    <circle cx='14' cy='14' r='4' fill='#7c3aed' />
    <line x1='14' y1='2' x2='14' y2='8' stroke='#06b6d4' strokeWidth='2' strokeLinecap='round' />
    <line x1='14' y1='20' x2='14' y2='26' stroke='#06b6d4' strokeWidth='2' strokeLinecap='round' />
    <line x1='2' y1='14' x2='8' y2='14' stroke='#06b6d4' strokeWidth='2' strokeLinecap='round' />
    <line x1='20' y1='14' x2='26' y2='14' stroke='#06b6d4' strokeWidth='2' strokeLinecap='round' />
  </svg>
)

// Cart icon
const CartIcon = () => (
  <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <circle cx='9' cy='21' r='1' />
    <circle cx='20' cy='21' r='1' />
    <path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' />
  </svg>
)

const navLinks = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Chuột', to: '/chuot' },
  { label: 'Bàn phím', to: '/ban-phim' },
  { label: 'Lót chuột', to: '/lot-chuot' },
  {
    label: 'Phụ kiện',
    children: [
      { label: 'Feet chuột', to: '/phu-kien/feet-chuot' },
      { label: 'Grip tape', to: '/phu-kien/grip-tape' },
      { label: 'Keycap', to: '/phu-kien/keycap' }
    ]
  }
]

const IS_CATALOG_PATH = /^\/(chuot|ban-phim|lot-chuot|phu-kien)(\/|$)/

const NavSearchIcon = () => (
  <svg
    className='h-3.5 w-3.5'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    aria-hidden='true'
  >
    <circle cx='11' cy='11' r='7' />
    <path d='M21 21l-4.35-4.35' />
  </svg>
)

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobile_submenu_open, setMobileSubmenuOpen] = useState(false)
  const [search_draft, setSearchDraft] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const [search_params] = useSearchParams()
  const { user, is_authenticated, logout } = useAuth()
  const { total_items } = useCart()

  const q_in_url = search_params.get('q') ?? ''

  useEffect(() => {
    setSearchDraft(q_in_url)
  }, [q_in_url, location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => {
    setMenuOpen(false)
    setMobileSubmenuOpen(false)
  }

  const submit_nav_search = e => {
    e.preventDefault()
    const q = search_draft.trim()
    const path = location.pathname
    if (IS_CATALOG_PATH.test(path)) {
      if (q) {
        navigate(`${path}?q=${encodeURIComponent(q)}`, { replace: true })
      } else {
        navigate(path, { replace: true })
      }
    } else if (q) {
      navigate(`/tim-kiem?q=${encodeURIComponent(q)}`, { replace: true })
    } else {
      navigate('/tim-kiem', { replace: true })
    }
    closeMenu()
  }

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#1e1e2e] bg-[#0a0a0f]/90 py-3 shadow-lg shadow-black/40 backdrop-blur-xl'
          : 'bg-transparent py-5'
      }`}
    >
      <nav className='mx-auto flex max-w-7xl items-center justify-between px-6'>
        {/* Logo */}
        <Link
          to='/'
          className='group flex items-center gap-3'
          aria-label='AimForge Home'
          onClick={closeMenu}
        >
          <div className='transition-all duration-300 group-hover:animate-glowPulse'>
            <CrosshairIcon />
          </div>
          <span className='font-display text-xl font-bold uppercase tracking-widest text-white transition-colors group-hover:text-[#9f67ff]'>
            Aim<span className='text-[#7c3aed]'>Forge</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className='m-0 hidden list-none items-center gap-8 p-0 md:flex'>
          {navLinks.map(link_item => {
            const is_active = link_item.children
              ? location.pathname.startsWith(link_item.to)
              : location.pathname === link_item.to

            if (!link_item.children) {
              return (
                <li key={link_item.to}>
                  <Link
                    to={link_item.to}
                    onClick={closeMenu}
                    className={`font-body text-sm font-medium uppercase tracking-wider transition-colors duration-200 hover:text-[#9f67ff] ${
                      is_active ? 'text-[#7c3aed]' : 'text-[#94a3b8]'
                    }`}
                  >
                    {link_item.label}
                  </Link>
                </li>
              )
            }

            return (
              <li key={link_item.to} className='group relative'>
                <Link
                  to={link_item.to}
                  onClick={closeMenu}
                  className={`flex items-center gap-1 font-body text-sm font-medium uppercase tracking-wider transition-colors duration-200 hover:text-[#9f67ff] ${
                    is_active ? 'text-[#7c3aed]' : 'text-[#94a3b8]'
                  }`}
                >
                  {link_item.label}
                  <svg
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    aria-hidden='true'
                  >
                    <polyline points='6 9 12 15 18 9' />
                  </svg>
                </Link>

                <div className='invisible absolute left-0 top-full z-20 mt-3 w-48 rounded-lg border border-white/10 bg-[#121225] p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100'>
                  {link_item.children.map(child_item => (
                    <Link
                      key={child_item.to}
                      to={child_item.to}
                      onClick={closeMenu}
                      className='block rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-[#9f67ff]'
                    >
                      {child_item.label}
                    </Link>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>

        {/* Actions: tìm kiếm (trái) + giỏ + đăng nhập */}
        <div className='hidden min-w-0 items-center gap-3 md:flex'>
          <form
            onSubmit={submit_nav_search}
            className='relative w-full min-w-[9rem] max-w-[14rem] shrink'
            role='search'
          >
            <label className='sr-only' htmlFor='nav-search'>
              Tìm sản phẩm
            </label>
            <span className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b]'>
              <NavSearchIcon />
            </span>
            <input
              id='nav-search'
              type='search'
              value={search_draft}
              onChange={e => setSearchDraft(e.target.value)}
              placeholder='Tìm sản phẩm…'
              autoComplete='off'
              className='h-9 w-full rounded-lg border border-white/10 bg-black/30 py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder:text-[#64748b] focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20'
            />
          </form>
          <Link
            to='/cart'
            aria-label='Cart'
            className='relative shrink-0 cursor-pointer text-[#94a3b8] transition-colors hover:text-[#06b6d4]'
          >
            <CartIcon />
            <span className='absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7c3aed] text-[9px] font-bold text-white'>
              {total_items}
            </span>
          </Link>

          {!is_authenticated && (
            <Link to='/login' className='btn-primary px-5 py-2 text-xs'>
              Đăng nhập
            </Link>
          )}

          {is_authenticated && (
            <>
              <Link
                to='/profile'
                className='flex h-10 min-w-[7rem] items-center gap-2 overflow-hidden rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-3 text-xs font-semibold uppercase tracking-wider text-[#d8b4fe] transition hover:border-cyan-400/50 hover:text-cyan-200 justify-center'
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt='Avatar'
                    className='h-6 w-6 shrink-0 rounded-full border border-white/20 object-cover'
                  />
                ) : (
                  <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] font-bold text-white'>
                    {(user?.username || 'U').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className='min-w-0 truncate'>
                  {user?.username || 'Profile'}
                </span>
              </Link>
              <button
                type='button'
                onClick={logout}
                className='inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/10 px-3 text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20'
              >
                Đăng xuất
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className='cursor-pointer p-1 text-[#94a3b8] transition-colors hover:text-white md:hidden'
          aria-label='Toggle menu'
          onClick={() => setMenuOpen(v => !v)}
        >
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
            {menuOpen ? (
              <>
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </>
            ) : (
              <>
                <line x1='3' y1='6' x2='21' y2='6' />
                <line x1='3' y1='12' x2='21' y2='12' />
                <line x1='3' y1='18' x2='21' y2='18' />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className='flex flex-col gap-4 border-t border-[#1e1e2e] bg-[#0f0f1a]/95 px-6 py-6 backdrop-blur-xl md:hidden'>
          <form
            onSubmit={submit_nav_search}
            className='relative w-full'
            role='search'
          >
            <label className='sr-only' htmlFor='nav-search-mobile'>
              Tìm sản phẩm
            </label>
            <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]'>
              <NavSearchIcon />
            </span>
            <input
              id='nav-search-mobile'
              type='search'
              value={search_draft}
              onChange={e => setSearchDraft(e.target.value)}
              placeholder='Tìm sản phẩm…'
              autoComplete='off'
              className='h-10 w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-[#64748b] focus:border-violet-500/40 focus:outline-none'
            />
          </form>
          {navLinks.map(link_item => {
            if (!link_item.children) {
              return (
                <Link
                  key={link_item.to}
                  to={link_item.to}
                  onClick={closeMenu}
                  className='font-body text-sm font-medium uppercase tracking-wider text-[#94a3b8] transition-colors hover:text-[#9f67ff]'
                >
                  {link_item.label}
                </Link>
              )
            }

            return (
              <div key={link_item.to} className='space-y-2'>
                <button
                  type='button'
                  onClick={() => setMobileSubmenuOpen(prev_value => !prev_value)}
                  className='flex w-full items-center justify-between font-body text-sm font-medium uppercase tracking-wider text-[#94a3b8] transition-colors hover:text-[#9f67ff]'
                >
                  {link_item.label}
                  <svg
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    aria-hidden='true'
                  >
                    {mobile_submenu_open ? (
                      <polyline points='18 15 12 9 6 15' />
                    ) : (
                      <polyline points='6 9 12 15 18 9' />
                    )}
                  </svg>
                </button>

                {mobile_submenu_open && (
                  <div className='grid gap-2 rounded-lg border border-white/10 bg-white/5 p-2'>
                    {link_item.children.map(child_item => (
                      <Link
                        key={child_item.to}
                        to={child_item.to}
                        onClick={closeMenu}
                        className='rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-[#9f67ff]'
                      >
                        {child_item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div className='flex gap-3 border-t border-[#1e1e2e] pt-4'>
            <Link
              to='/cart'
              onClick={closeMenu}
              className='w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]'
            >
              Cart ({total_items})
            </Link>
            {!is_authenticated && (
              <Link
                to='/login'
                onClick={closeMenu}
                className='btn-primary w-full justify-center px-5 py-2.5 text-xs'
              >
                Sign In
              </Link>
            )}
            {is_authenticated && (
              <>
                <Link
                  to='/profile'
                  onClick={closeMenu}
                  className='flex h-11 w-full items-center justify-center rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-4 text-center text-xs font-semibold uppercase tracking-wider text-[#d8b4fe]'
                >
                  Profile
                </Link>
                <button
                  type='button'
                  onClick={logout}
                  className='inline-flex h-11 w-full items-center justify-center rounded-lg border border-red-400/40 bg-red-500/10 px-4 text-xs font-semibold uppercase tracking-wider text-red-300'
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
