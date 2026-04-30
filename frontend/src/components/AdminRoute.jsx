import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminRoute({ children }) {
  const { is_authenticated, auth_loading, user } = useAuth()

  if (auth_loading) {
    return (
      <section className='mx-auto min-h-[60vh] max-w-7xl px-6 pt-28'>
        <div className='skeleton h-56 w-full rounded-2xl' />
      </section>
    )
  }

  if (!is_authenticated) {
    return <Navigate to='/login' replace />
  }

  const role_names = (user?.roles || []).map(role_name =>
    String(role_name).toUpperCase()
  )
  if (!role_names.includes('ADMIN')) {
    return <Navigate to='/' replace />
  }

  return children
}
