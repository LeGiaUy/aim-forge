import { Link } from 'react-router-dom'

const CrosshairIcon = () => (
  <svg
    width='30'
    height='30'
    viewBox='0 0 28 28'
    fill='none'
    aria-hidden='true'
  >
    <circle cx='14' cy='14' r='10' stroke='#7c3aed' strokeWidth='1.5' />
    <circle cx='14' cy='14' r='4' fill='#7c3aed' />
    <line
      x1='14'
      y1='2'
      x2='14'
      y2='8'
      stroke='#06b6d4'
      strokeWidth='2'
      strokeLinecap='round'
    />
    <line
      x1='14'
      y1='20'
      x2='14'
      y2='26'
      stroke='#06b6d4'
      strokeWidth='2'
      strokeLinecap='round'
    />
    <line
      x1='2'
      y1='14'
      x2='8'
      y2='14'
      stroke='#06b6d4'
      strokeWidth='2'
      strokeLinecap='round'
    />
    <line
      x1='20'
      y1='14'
      x2='26'
      y2='14'
      stroke='#06b6d4'
      strokeWidth='2'
      strokeLinecap='round'
    />
  </svg>
)

export default function AuthLayout({ title_text, subtitle_text, children }) {
  return (
    <main className='min-h-screen bg-[#07070d]'>
      <div className='grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_560px]'>
        <section className='relative hidden overflow-hidden border-r border-white/10 lg:flex'>
          <div className='hex-bg absolute inset-0' />
          <div className='absolute inset-0 bg-gradient-to-br from-[#7c3aed]/25 via-transparent to-[#06b6d4]/20' />
          <div className='relative z-10 flex flex-col justify-between p-12'>
            <Link to='/' className='inline-flex w-fit items-center gap-3'>
              <CrosshairIcon />
              <span className='font-display text-2xl font-bold uppercase tracking-widest text-white'>
                Aim<span className='text-[#7c3aed]'>Forge</span>
              </span>
            </Link>

            <div>
              <p className='font-display text-sm uppercase tracking-[0.25em] text-cyan-300'>
                Premium FPS gear
              </p>
              <h2 className='mt-4 max-w-lg font-display text-4xl font-bold leading-tight uppercase text-white'>
                Lock in. Gear up. Dominate every duel.
              </h2>
              <p className='mt-4 max-w-md text-sm leading-7 text-[#cbd5e1]'>
                Engineered gaming peripherals for competitive players who demand
                elite precision and zero compromise.
              </p>
            </div>
          </div>
        </section>

        <section className='flex items-center justify-center px-4 py-12 sm:px-6'>
          <div className='w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8'>
            <h1 className='font-display text-3xl font-bold uppercase text-white'>
              {title_text}
            </h1>
            <p className='mt-2 text-sm text-[#94a3b8]'>{subtitle_text}</p>
            <div className='mt-6'>{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
