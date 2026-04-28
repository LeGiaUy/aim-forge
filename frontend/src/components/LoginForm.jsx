import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Button from './Button.jsx'
import Input from './Input.jsx'

const EyeIcon = ({ is_open }) => (
  <svg
    className='h-4 w-4'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    aria-hidden='true'
  >
    {is_open ? (
      <>
        <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
        <circle cx='12' cy='12' r='3' />
      </>
    ) : (
      <>
        <path d='M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.68 21.68 0 015.06-6.94' />
        <path d='M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.31 21.31 0 01-3.16 4.19' />
        <path d='M1 1l22 22' />
      </>
    )}
  </svg>
)

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form_state, setFormState] = useState({
    identifier: '',
    password: '',
    remember_me: true
  })
  const [error_message, setErrorMessage] = useState('')
  const [toast_message, setToastMessage] = useState('')
  const [is_password_open, setIsPasswordOpen] = useState(false)
  const [is_loading, setIsLoading] = useState(false)

  const handleChange = event => {
    const { name, value, type, checked } = event.target
    setFormState(prev_state => ({
      ...prev_state,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setErrorMessage('')

    const payload = {
      email: form_state.identifier.trim(),
      password: form_state.password
    }

    if (!payload.email || !payload.password) {
      setErrorMessage('Please enter email/username and password')
      return
    }

    setIsLoading(true)
    try {
      await login(payload)
      setToastMessage('Login success! Redirecting...')
      setTimeout(() => navigate('/'), 700)
    } catch (error) {
      setErrorMessage(error.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {toast_message && (
        <p className='rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300'>
          {toast_message}
        </p>
      )}

      {error_message && (
        <p className='rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300'>
          {error_message}
        </p>
      )}

      <Input
        label_text='Email or username'
        name='identifier'
        value={form_state.identifier}
        onChange={handleChange}
        placeholder='you@example.com'
        autoComplete='username'
      />

      <div className='relative'>
        <Input
          label_text='Password'
          name='password'
          value={form_state.password}
          onChange={handleChange}
          type={is_password_open ? 'text' : 'password'}
          placeholder='Enter your password'
          autoComplete='current-password'
          class_name='pr-11'
        />
        <button
          type='button'
          aria-label='Toggle password visibility'
          onClick={() => setIsPasswordOpen(prev_state => !prev_state)}
          className='absolute right-3 top-[38px] flex h-8 w-8 items-center justify-center text-[#94a3b8] transition hover:text-white'
        >
          <EyeIcon is_open={is_password_open} />
        </button>
      </div>

      <label className='flex cursor-pointer items-center gap-2 text-xs text-[#cbd5e1]'>
        <input
          type='checkbox'
          name='remember_me'
          checked={form_state.remember_me}
          onChange={handleChange}
          className='h-4 w-4 rounded border-white/20 bg-transparent text-[#7c3aed] accent-[#7c3aed]'
        />
        Remember me
      </label>

      <Button type='submit' loading={is_loading}>
        Login
      </Button>

      <p className='text-center text-xs text-[#94a3b8]'>
        No account yet?{' '}
        <Link
          to='/register'
          className='font-semibold text-[#9f67ff] transition hover:text-cyan-300'
        >
          Create account
        </Link>
      </p>
    </form>
  )
}
