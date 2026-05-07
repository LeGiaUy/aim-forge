import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminUserApi } from '../../../services/adminApi.js'

const USER_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'BANNED']
const USER_STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Không hoạt động',
  BANNED: 'Bị khóa'
}

export default function UserList() {
  const [users_data, setUsersData] = useState([])
  const [roles_data, setRolesData] = useState([])
  const [is_loading, setIsLoading] = useState(true)
  const [error_message, setErrorMessage] = useState('')

  const [filter_status, setFilterStatus] = useState('')
  const [filter_role, setFilterRole] = useState('')
  const [current_page, setCurrentPage] = useState(1)
  const [pagination_data, setPaginationData] = useState({
    page: 1,
    total_pages: 1
  })

  const fetch_roles = async () => {
    const response = await adminUserApi.getRoles()
    setRolesData(response.data.data || [])
  }

  const fetch_users = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await adminUserApi.getUsers({
        page: current_page,
        limit: 10,
        status: filter_status || undefined,
        role: filter_role || undefined
      })

      setUsersData(response.data.data?.items || [])
      setPaginationData(
        response.data.data?.pagination || {
          page: 1,
          total_pages: 1
        }
      )
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetch_roles()
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetch_users()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current_page, filter_status, filter_role])

  const handle_status_change = async (user_id, status) => {
    try {
      await adminUserApi.updateStatus(user_id, status)
      fetch_users()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handle_assign_role = async (user_id, role_id) => {
    try {
      await adminUserApi.assignRoles(user_id, [role_id])
      fetch_users()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-6 text-white'>
      <header className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-2xl font-semibold'>Người dùng</h1>

        <div className='flex flex-wrap gap-2'>
          <select
            value={filter_status}
            onChange={event => {
              setCurrentPage(1)
              setFilterStatus(event.target.value)
            }}
            className='rounded-lg border border-white/10 bg-[#0d0d1a] px-3 py-2 text-sm'
          >
            <option value=''>Tất cả trạng thái</option>
            {USER_STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {USER_STATUS_LABELS[status] || status}
              </option>
            ))}
          </select>

          <select
            value={filter_role}
            onChange={event => {
              setCurrentPage(1)
              setFilterRole(event.target.value)
            }}
            className='rounded-lg border border-white/10 bg-[#0d0d1a] px-3 py-2 text-sm'
          >
            <option value=''>Tất cả vai trò</option>
            {roles_data.map(role_item => (
              <option key={role_item.role_id} value={role_item.role_name}>
                {role_item.role_name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error_message && (
        <p className='mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300'>
          {error_message}
        </p>
      )}

      <div className='overflow-x-auto rounded-xl border border-white/10'>
        <table className='min-w-full text-sm'>
          <thead className='bg-white/5 text-left text-xs uppercase text-[#94a3b8]'>
            <tr>
              <th className='px-4 py-3'>Username</th>
              <th className='px-4 py-3'>Email</th>
              <th className='px-4 py-3'>Trạng thái</th>
              <th className='px-4 py-3'>Vai trò</th>
              <th className='px-4 py-3'>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {is_loading ? (
              <tr>
                <td className='px-4 py-5 text-[#94a3b8]' colSpan={5}>
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : users_data.length === 0 ? (
              <tr>
                <td className='px-4 py-5 text-[#94a3b8]' colSpan={5}>
                  Không tìm thấy người dùng
                </td>
              </tr>
            ) : (
              users_data.map(user_item => (
                <tr key={user_item.user_id} className='border-t border-white/10'>
                  <td className='px-4 py-3'>{user_item.username}</td>
                  <td className='px-4 py-3'>{user_item.email}</td>
                  <td className='px-4 py-3'>
                    {USER_STATUS_LABELS[user_item.status] || user_item.status}
                  </td>
                  <td className='px-4 py-3'>
                    {(user_item.roles || []).join(', ') || 'Chưa có'}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-2'>
                      <select
                        defaultValue={user_item.status}
                        onChange={event =>
                          handle_status_change(
                            user_item.user_id,
                            event.target.value
                          )
                        }
                        className='rounded-md border border-white/10 bg-[#0d0d1a] px-2 py-1 text-xs'
                      >
                        {USER_STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>
                            {USER_STATUS_LABELS[status] || status}
                          </option>
                        ))}
                      </select>

                      <select
                        defaultValue=''
                        onChange={event => {
                          if (!event.target.value) return
                          handle_assign_role(
                            user_item.user_id,
                            Number(event.target.value)
                          )
                        }}
                        className='rounded-md border border-white/10 bg-[#0d0d1a] px-2 py-1 text-xs'
                      >
                        <option value=''>Gán vai trò</option>
                        {roles_data.map(role_item => (
                          <option
                            key={role_item.role_id}
                            value={role_item.role_id}
                          >
                            {role_item.role_name}
                          </option>
                        ))}
                      </select>

                      <Link
                        to={`/admin/users/${user_item.user_id}`}
                        className='rounded-md bg-[#7c3aed] px-3 py-1 text-xs font-semibold text-white'
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-4 flex items-center gap-2'>
        <button
          className='rounded-md border border-white/10 px-3 py-1 text-sm disabled:opacity-40'
          onClick={() => setCurrentPage(prev_page => Math.max(prev_page - 1, 1))}
          disabled={pagination_data.page <= 1}
        >
          Trước
        </button>
        <span className='text-sm text-[#94a3b8]'>
          Trang {pagination_data.page} / {pagination_data.total_pages}
        </span>
        <button
          className='rounded-md border border-white/10 px-3 py-1 text-sm disabled:opacity-40'
          onClick={() =>
            setCurrentPage(prev_page =>
              Math.min(prev_page + 1, pagination_data.total_pages)
            )
          }
          disabled={pagination_data.page >= pagination_data.total_pages}
        >
          Sau
        </button>
      </div>
    </section>
  )
}
