import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Button from './Button.jsx'
import Input from './Input.jsx'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form_state, setFormState] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  })
  const [error_map, setErrorMap] = useState({})
  const [submit_error, setSubmitError] = useState('')
  const [is_loading, setIsLoading] = useState(false)
  const [success_message, setSuccessMessage] = useState('')

  const has_form_error = useMemo(() => {
    return Object.keys(error_map).length > 0
  }, [error_map])

  const handleChange = event => {
    const { name, value } = event.target
    setFormState(prev_state => ({ ...prev_state, [name]: value }))
  }

  const validateForm = () => {
    const next_errors = {}
    if (!form_state.username.trim()) {
      next_errors.username = 'Username is required'
    }

    if (!/\S+@\S+\.\S+/.test(form_state.email)) {
      next_errors.email = 'Invalid email format'
    }

    if ((form_state.password || '').length < 6) {
      next_errors.password = 'Password must be at least 6 characters'
    }

    if (form_state.password !== form_state.confirm_password) {
      next_errors.confirm_password = 'Passwords do not match'
    }

    setErrorMap(next_errors)
    return Object.keys(next_errors).length === 0
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setSubmitError('')

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await register({
        username: form_state.username.trim(),
        email: form_state.email.trim(),
        password: form_state.password
      })

      setSuccessMessage('Account created successfully. Redirecting to login...')
      setTimeout(() => navigate('/login'), 900)
    } catch (error) {
      setSubmitError(error.message || 'Register failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {success_message && (
        <p className='rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300'>
          {success_message}
        </p>
      )}

      {submit_error && (
        <p className='rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300'>
          {submit_error}
        </p>
      )}

      <Input
        label_text='Username'
        name='username'
        value={form_state.username}
        onChange={handleChange}
        placeholder='fps_player'
        error_text={error_map.username}
      />

      <Input
        label_text='Email'
        name='email'
        value={form_state.email}
        onChange={handleChange}
        placeholder='you@example.com'
        error_text={error_map.email}
      />

      <Input
        label_text='Password'
        name='password'
        type='password'
        value={form_state.password}
        onChange={handleChange}
        placeholder='At least 6 characters'
        error_text={error_map.password}
      />

      <Input
        label_text='Confirm password'
        name='confirm_password'
        type='password'
        value={form_state.confirm_password}
        onChange={handleChange}
        placeholder='Retype password'
        error_text={error_map.confirm_password}
      />

      <Button type='submit' loading={is_loading} disabled={has_form_error}>
        Register
      </Button>

      <p className='text-center text-xs text-[#94a3b8]'>
        Already have an account?{' '}
        <Link
          to='/login'
          className='font-semibold text-[#9f67ff] transition hover:text-cyan-300'
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
