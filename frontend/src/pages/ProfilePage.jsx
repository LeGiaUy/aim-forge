import { useEffect, useState } from 'react'
import { profileApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProfilePage() {
  const { refresh_user } = useAuth()
  const [profile_data, setProfileData] = useState(null)
  const [is_loading, setIsLoading] = useState(true)
  const [error_text, setErrorText] = useState('')
  const [success_text, setSuccessText] = useState('')
  const [password_error_text, setPasswordErrorText] = useState('')
  const [password_success_text, setPasswordSuccessText] = useState('')
  const [is_updating_profile, setIsUpdatingProfile] = useState(false)
  const [is_changing_password, setIsChangingPassword] = useState(false)
  const [is_uploading_avatar, setIsUploadingAvatar] = useState(false)

  const [profile_form, setProfileForm] = useState({
    username: '',
    email: '',
    avatar: '',
    phone: '',
    address: ''
  })
  const [password_form, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: ''
  })

  useEffect(() => {
    const fetch_profile = async () => {
      setIsLoading(true)
      setErrorText('')

      try {
        const response = await profileApi.getMe()
        const next_profile = response.data?.data || null
        setProfileData(next_profile)
        setProfileForm({
          username: next_profile?.username || '',
          email: next_profile?.email || '',
          avatar: next_profile?.avatar || '',
          phone: next_profile?.phone || '',
          address: next_profile?.address || ''
        })
      } catch (error) {
        setErrorText(error.message || 'Cannot load profile')
      } finally {
        setIsLoading(false)
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch_profile()
  }, [])

  const handle_profile_change = event => {
    const { name, value } = event.target
    setProfileForm(prev_state => ({
      ...prev_state,
      [name]: value
    }))
  }

  const handle_password_change = event => {
    const { name, value } = event.target
    setPasswordForm(prev_state => ({
      ...prev_state,
      [name]: value
    }))
  }

  const handle_profile_submit = async event => {
    event.preventDefault()
    setErrorText('')
    setSuccessText('')

    if (!profile_form.username.trim()) {
      setErrorText('Username is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(profile_form.email)) {
      setErrorText('Invalid email format')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const response = await profileApi.updateMe({
        username: profile_form.username.trim(),
        email: profile_form.email.trim(),
        avatar: profile_form.avatar.trim(),
        phone: profile_form.phone.trim(),
        address: profile_form.address.trim()
      })
      setProfileData(response.data?.data || null)
      await refresh_user()
      setSuccessText('Profile updated successfully')
    } catch (error) {
      setErrorText(error.message || 'Cannot update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handle_avatar_upload = async event => {
    const selected_file = event.target.files?.[0]
    if (!selected_file) {
      return
    }

    setErrorText('')
    setSuccessText('')
    setIsUploadingAvatar(true)
    try {
      const form_data = new FormData()
      form_data.append('images', selected_file)
      const response = await profileApi.uploadAvatar(form_data)
      const avatar_url = response.data?.data?.avatar_url || ''

      setProfileForm(prev_state => ({
        ...prev_state,
        avatar: avatar_url
      }))
      setSuccessText('Avatar uploaded. Click "Update profile" to save.')
    } catch (error) {
      setErrorText(error.message || 'Cannot upload avatar')
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const handle_password_submit = async event => {
    event.preventDefault()
    setPasswordErrorText('')
    setPasswordSuccessText('')

    if (!password_form.oldPassword || !password_form.newPassword) {
      setPasswordErrorText('Please fill all password fields')
      return
    }
    if (password_form.newPassword.length < 6) {
      setPasswordErrorText('New password must be at least 6 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      await profileApi.changePassword({
        oldPassword: password_form.oldPassword,
        newPassword: password_form.newPassword
      })
      setPasswordForm({ oldPassword: '', newPassword: '' })
      setPasswordSuccessText('Password changed successfully')
    } catch (error) {
      setPasswordErrorText(error.message || 'Cannot change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <main className='mx-auto min-h-screen max-w-4xl px-6 pb-12 pt-28 text-white'>
      <section className='rounded-2xl border border-white/10 bg-[#0b1120] p-6'>
        <h1 className='text-2xl font-bold'>My profile</h1>
        <div className='mt-4 flex items-center gap-4'>
          {profile_data?.avatar ? (
            <img
              src={profile_data.avatar}
              alt='Profile avatar'
              className='h-20 w-20 rounded-full border border-white/20 object-cover'
            />
          ) : (
            <div className='flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs text-[#94a3b8]'>
              No Avatar
            </div>
          )}
          <div className='text-sm text-[#94a3b8]'>
            Upload avatar in Edit profile section
          </div>
        </div>
        {is_loading ? (
          <p className='mt-3 text-sm text-[#94a3b8]'>Loading profile...</p>
        ) : (
          <div className='mt-4 grid gap-3 text-sm text-[#cbd5e1] sm:grid-cols-2'>
            <p>Username: {profile_data?.username || 'N/A'}</p>
            <p>Email: {profile_data?.email || 'N/A'}</p>
            <p>Phone: {profile_data?.phone || 'N/A'}</p>
            <p>Address: {profile_data?.address || 'N/A'}</p>
          </div>
        )}
      </section>

      <section className='mt-6 rounded-2xl border border-white/10 bg-[#0b1120] p-6'>
        <h2 className='text-lg font-semibold'>Edit profile</h2>
        {error_text && (
          <p className='mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300'>
            {error_text}
          </p>
        )}
        {success_text && (
          <p className='mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300'>
            {success_text}
          </p>
        )}

        <form className='mt-4 grid gap-3' onSubmit={handle_profile_submit}>
          <label className='text-sm text-[#cbd5e1]'>Profile avatar</label>
          <input
            type='file'
            accept='image/*'
            onChange={handle_avatar_upload}
            className='rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#7c3aed] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white'
          />
          {is_uploading_avatar && (
            <p className='text-xs text-[#94a3b8]'>Uploading avatar...</p>
          )}
          {profile_form.avatar && (
            <img
              src={profile_form.avatar}
              alt='Avatar preview'
              className='h-20 w-20 rounded-full border border-white/20 object-cover'
            />
          )}
          <input
            name='username'
            value={profile_form.username}
            onChange={handle_profile_change}
            placeholder='Username'
            className='rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm'
          />
          <input
            name='email'
            value={profile_form.email}
            onChange={handle_profile_change}
            placeholder='Email'
            className='rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm'
          />
          <input
            name='phone'
            value={profile_form.phone}
            onChange={handle_profile_change}
            placeholder='Phone'
            className='rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm'
          />
          <input
            name='address'
            value={profile_form.address}
            onChange={handle_profile_change}
            placeholder='Address'
            className='rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm'
          />
          <button
            type='submit'
            disabled={is_updating_profile}
            className='rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold disabled:opacity-60'
          >
            {is_updating_profile ? 'Updating...' : 'Update profile'}
          </button>
        </form>
      </section>

      <section className='mt-6 rounded-2xl border border-white/10 bg-[#0b1120] p-6'>
        <h2 className='text-lg font-semibold'>Change password</h2>
        {password_error_text && (
          <p className='mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300'>
            {password_error_text}
          </p>
        )}
        {password_success_text && (
          <p className='mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300'>
            {password_success_text}
          </p>
        )}

        <form className='mt-4 grid gap-3' onSubmit={handle_password_submit}>
          <input
            name='oldPassword'
            type='password'
            value={password_form.oldPassword}
            onChange={handle_password_change}
            placeholder='Old password'
            className='rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm'
          />
          <input
            name='newPassword'
            type='password'
            value={password_form.newPassword}
            onChange={handle_password_change}
            placeholder='New password'
            className='rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm'
          />
          <button
            type='submit'
            disabled={is_changing_password}
            className='rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold disabled:opacity-60'
          >
            {is_changing_password ? 'Saving...' : 'Change password'}
          </button>
        </form>
      </section>
    </main>
  )
}
