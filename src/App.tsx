import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { LanguageProvider, useLanguage, type Locale } from './context/LanguageContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { DashboardAdminPage } from './pages/DashboardAdminPage'
import { DashboardScholarAdminPage } from './pages/DashboardScholarAdminPage'
import { DashboardTeacherPage } from './pages/DashboardTeacherPage'
import { DashboardStudentsPage } from './pages/DashboardStudentsPage'
import { KitchenPage } from './pages/KitchenPage'

function getPathLocale(path: string): Locale | null {
  const match = path.match(/^\/(es|en)(?:\/|$)/)
  return match ? (match[1] as Locale) : null
}

function Router() {
  const [path, setPath] = useState(window.location.pathname)
  const { token, role } = useAuth()
  const { locale, setLocale } = useLanguage()

  const pathLocale = useMemo(() => getPathLocale(path), [path])
  const isDashboardPath = /^\/(es|en)\/dashboard$/.test(path)
  const dashboardPath = useMemo(() => `/${locale}/dashboard`, [locale])

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }, [])

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  useEffect(() => {
    if (pathLocale && pathLocale !== locale) {
      setLocale(pathLocale)
    }
  }, [locale, pathLocale, setLocale])

  useEffect(() => {
    if (isDashboardPath && pathLocale && pathLocale !== locale) {
      navigate(`/${locale}/dashboard`)
    }
  }, [isDashboardPath, locale, navigate, pathLocale])

  useEffect(() => {
    if (!token && isDashboardPath) {
      navigate('/login')
    }
  }, [isDashboardPath, navigate, token])

  useEffect(() => {
    if (token && path === '/login') {
      navigate(dashboardPath)
    }
  }, [dashboardPath, navigate, path, token])

  useEffect(() => {
    if (path === '/portal') {
      navigate(dashboardPath)
    }
  }, [dashboardPath, navigate, path])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (path === '/login') {
    return <LoginPage onNavigate={navigate} />
  }

  if (isDashboardPath && token) {
    switch (role) {
      case 'ADMIN':
        return <DashboardAdminPage onNavigate={navigate} />
      case 'SCHOLAR_ADMIN':
      case 'SCHOOL':
        return <DashboardScholarAdminPage onNavigate={navigate} />
      case 'TEACHER':
        return <DashboardTeacherPage onNavigate={navigate} />
      case 'STUDENT':
        return <DashboardStudentsPage onNavigate={navigate} />
      case 'KITCHEN':
        return <KitchenPage onNavigate={navigate} />
      default:
        return <HomePage onNavigate={navigate} />
    }
  }

  return <HomePage onNavigate={navigate} />
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </LanguageProvider>
  )
}
