import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { profileApi } from '../services/api.js'
import { orderApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatVnd } from '../utils/currency.js'

export default function ProfilePage() {
  const { refresh_user } = useAuth()
  const [profile_data, setProfileData] = useState(null)
  const [orders_data, setOrdersData] = useState([])
  const [is_loading, setIsLoading] = useState(true)
  const [is_loading_orders, setIsLoadingOrders] = useState(true)
  const [error_text, setErrorText] = useState('')
  const [orders_error_text, setOrdersErrorText] = useState('')
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
    const fetch_profile_and_orders = async () => {
      setIsLoading(true)
      setIsLoadingOrders(true)
      setErrorText('')
      setOrdersErrorText('')

      try {
        const profile_response = await profileApi.getMe()
        const next_profile = profile_response.data?.data || null
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

      try {
        const orders_response = await orderApi.getOrders()
        const next_orders = orders_response.data?.data || []
        setOrdersData(Array.isArray(next_orders) ? next_orders : [])
      } catch (error) {
        setOrdersErrorText(error.message || 'Cannot load orders')
      } finally {
        setIsLoadingOrders(false)
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch_profile_and_orders()
  }, [])

  const get_status_class_name = status_value => {
    const status_class_map = {
      PENDING: 'border-amber-300/30 bg-amber-500/10 text-amber-300',
      PAID: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-300',
      PROCESSING: 'border-indigo-300/30 bg-indigo-500/10 text-indigo-300',
      SHIPPED: 'border-sky-300/30 bg-sky-500/10 text-sky-300',
      COMPLETED: 'border-teal-300/30 bg-teal-500/10 text-teal-300',
      FAILED: 'border-rose-300/30 bg-rose-500/10 text-rose-300',
      CANCELLED: 'border-zinc-300/30 bg-zinc-500/10 text-zinc-300',
      SUCCESS: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-300'
    }

    return (
      status_class_map[status_value] ||
      'border-zinc-300/30 bg-zinc-500/10 text-zinc-300'
    )
  }

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

      <section className='mt-6 rounded-2xl border border-white/10 bg-[#0b1120] p-6'>
        <h2 className='text-lg font-semibold'>My orders</h2>

        {orders_error_text && (
          <p className='mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300'>
            {orders_error_text}
          </p>
        )}

        {is_loading_orders ? (
          <p className='mt-3 text-sm text-[#94a3b8]'>Loading orders...</p>
        ) : orders_data.length === 0 ? (
          <p className='mt-3 text-sm text-[#94a3b8]'>
            You have no orders yet.
          </p>
        ) : (
          <ul className='mt-4 space-y-3'>
            {orders_data.map(order_item => (
              <li
                key={order_item.order_id}
                className='rounded-xl border border-white/10 bg-[#020617] p-4'
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-white'>
                      Order #{order_item.order_id}
                    </p>
                    <p className='mt-1 text-xs text-[#94a3b8]'>
                      {new Date(order_item.created_at).toLocaleString('vi-VN')}
                    </p>
                    <p className='mt-1 text-xs text-[#cbd5e1]'>
                      Total: {formatVnd(order_item.total)}
                    </p>
                    {order_item.items?.[0] && (
                      <div className='mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f172a]/60 p-2'>
                        {order_item.items[0].image ? (
                          <img
                            src={order_item.items[0].image}
                            alt={order_item.items[0].variant_name || order_item.items[0].product_name}
                            className='h-10 w-10 rounded-md border border-white/10 object-cover'
                          />
                        ) : (
                          <div className='flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#111827] text-[9px] text-[#94a3b8]'>
                            No image
                          </div>
                        )}
                        <div className='min-w-0'>
                          <p className='truncate text-xs font-semibold text-white'>
                            {order_item.items[0].product_name}
                          </p>
                          <p className='truncate text-xs text-[#cbd5e1]'>
                            {order_item.items[0].variant_name ||
                              `Variant #${order_item.items[0].variant_id}`}
                          </p>
                          {order_item.items.length > 1 && (
                            <p className='text-[11px] text-[#94a3b8]'>
                              +{order_item.items.length - 1} more item(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${get_status_class_name(order_item.status)}`}
                    >
                      Order: {order_item.status}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${get_status_class_name(order_item.payment_status || 'PENDING')}`}
                    >
                      Payment: {order_item.payment_status || 'PENDING'}
                    </span>
                    <Link
                      to={`/profile/orders/${order_item.order_id}`}
                      className='rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#7c3aed]/20'
                    >
                      View detail
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
