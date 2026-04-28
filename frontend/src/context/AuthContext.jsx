import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api.js'

const AUTH_TOKEN_KEY = 'aimforge_token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user_data, setUserData] = useState(null)
  const [token_value, setTokenValue] = useState(
    localStorage.getItem(AUTH_TOKEN_KEY) || ''
  )
  const [auth_loading, setAuthLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!token_value) {
        setAuthLoading(false)
        return
      }

      try {
        const response = await authApi.getMe()
        setUserData(response.data.data || null)
      } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setTokenValue('')
        setUserData(null)
      } finally {
        setAuthLoading(false)
      }
    }

    bootstrapAuth()
  }, [token_value])

  const login = async payload => {
    const response = await authApi.login(payload)
    const response_data = response.data.data
    localStorage.setItem(AUTH_TOKEN_KEY, response_data.token)
    setTokenValue(response_data.token)
    setUserData(response_data.user)
    return response_data
  }

  const register = async payload => {
    return authApi.register(payload)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setTokenValue('')
    setUserData(null)
  }

  const context_value = useMemo(
    () => ({
      user: user_data,
      token: token_value,
      is_authenticated: Boolean(token_value && user_data),
      auth_loading,
      login,
      register,
      logout
    }),
    [user_data, token_value, auth_loading]
  )

  return (
    <AuthContext.Provider value={context_value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context_value = useContext(AuthContext)
  if (!context_value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context_value
}
