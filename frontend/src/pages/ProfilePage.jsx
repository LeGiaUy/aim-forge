import { useAuth } from '../context/AuthContext.jsx'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <main className='mx-auto min-h-screen max-w-4xl px-6 pb-12 pt-28'>
      <section className='glass-card rounded-2xl p-6'>
        <h1 className='font-display text-2xl font-bold uppercase text-white'>
          My account
        </h1>
        <p className='mt-2 text-sm text-[#94a3b8]'>
          Signed in as {user?.username || user?.email}
        </p>

        <div className='mt-6 space-y-2 text-sm text-[#cbd5e1]'>
          <p>Username: {user?.username || 'N/A'}</p>
          <p>Email: {user?.email || 'N/A'}</p>
          <p>User ID: {user?.user_id || 'N/A'}</p>
        </div>

        <button
          type='button'
          onClick={logout}
          className='mt-6 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs font-display uppercase tracking-wider text-red-300 transition hover:bg-red-500/20'
        >
          Logout
        </button>
      </section>
    </main>
  )
}
