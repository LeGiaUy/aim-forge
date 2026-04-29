import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  { label: 'Home', to: '/' },
  { label: 'Featured', to: '/#featured-products' }
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { user, is_authenticated, logout } = useAuth()
  const { total_items } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

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
          {navLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={closeMenu}
                className={`font-body text-sm font-medium uppercase tracking-wider transition-colors duration-200 hover:text-[#9f67ff] ${
                  location.pathname === link.to
                    ? 'text-[#7c3aed]'
                    : 'text-[#94a3b8]'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className='hidden items-center gap-4 md:flex'>
          <Link
            to='/cart'
            aria-label='Cart'
            className='relative cursor-pointer text-[#94a3b8] transition-colors hover:text-[#06b6d4]'
          >
            <CartIcon />
            <span className='absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7c3aed] text-[9px] font-bold text-white'>
              {total_items}
            </span>
          </Link>

          {!is_authenticated && (
            <Link to='/login' className='btn-primary px-5 py-2 text-xs'>
              Sign In
            </Link>
          )}

          {is_authenticated && (
            <>
              <Link
                to='/profile'
                className='rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#d8b4fe] transition hover:border-cyan-400/50 hover:text-cyan-200'
              >
                {user?.username || 'Profile'}
              </Link>
              <button
                type='button'
                onClick={logout}
                className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20'
              >
                Logout
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
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className='font-body text-sm font-medium uppercase tracking-wider text-[#94a3b8] transition-colors hover:text-[#9f67ff]'
            >
              {link.label}
            </Link>
          ))}
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
                  className='w-full rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#d8b4fe]'
                >
                  Profile
                </Link>
                <button
                  type='button'
                  onClick={logout}
                  className='w-full rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-300'
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
