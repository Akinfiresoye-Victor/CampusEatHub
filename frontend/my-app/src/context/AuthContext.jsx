import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, logout as logoutApi } from '../api/authApi'
import LoadingScreen from '../components/LoadingScreen'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.data)
        }
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = (userData) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (err) {
      // session may already be gone, continue anyway
    }
    setUser(null)
    window.location.href = '/login'
  }

  const isAuthenticated = () => user !== null

  if (isLoading) return <LoadingScreen />

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}