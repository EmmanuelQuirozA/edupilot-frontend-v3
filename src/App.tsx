import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { SchoolsPage } from './pages/SchoolsPage'

function getPathLocale(path: string): Locale | null {
  const match = path.match(/^\/(es|en)(?:\/|$)/)
  return match ? (match[1] as Locale) : null
}

function Router() {
  const [path, setPath] = useState(window.location.pathname)
  const { token, role } = useAuth()
  const { locale, setLocale } = useLanguage()

  const pathLocale = useMemo(() => getPathLocale(path), [path])
  const isDashboardRootPath = /^\/(es|en)\/dashboard$/.test(path)
  const isSchoolsPath = /^\/(es|en)\/dashboard\/schools$/.test(path)
  const isDashboardAreaPath = /^\/(es|en)\/dashboard(?:\/.*)?$/.test(path)
  const isLoginPath = path === '/login' || /^\/(es|en)\/login$/.test(path)
  const dashboardPath = useMemo(() => `/${locale}/dashboard`, [locale])
  const localeRef = useRef(locale)

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
    localeRef.current = locale
  }, [locale])

  useEffect(() => {
    if (pathLocale && pathLocale !== localeRef.current) {
      setLocale(pathLocale)
    }
  }, [pathLocale, setLocale])

  useEffect(() => {
    if (!pathLocale) {
      navigate(`/${locale}${path}`)
      return
    }

    if (pathLocale !== locale) {
      navigate(path.replace(/^\/(es|en)/, `/${locale}`))
    }
  }, [locale, navigate, path, pathLocale])

  useEffect(() => {
    if (isDashboardRootPath && pathLocale && pathLocale !== locale) {
      navigate(`/${locale}/dashboard`)
    }
  }, [isDashboardRootPath, locale, navigate, pathLocale])

  useEffect(() => {
    if (!token && isDashboardAreaPath) {
      navigate('/login')
    }
  }, [isDashboardAreaPath, navigate, token])

  useEffect(() => {
    if (token && isLoginPath) {
      navigate(dashboardPath)
    }
  }, [dashboardPath, isLoginPath, navigate, path, token])

  useEffect(() => {
    if (path === '/portal') {
      navigate(dashboardPath)
    }
  }, [dashboardPath, navigate, path])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (isLoginPath) {
    return <LoginPage onNavigate={navigate} />
  }

  if (isDashboardAreaPath && token) {
    if (isSchoolsPath) {
      return <SchoolsPage onNavigate={navigate} />
    }

    if (!isDashboardRootPath) {
      return <DashboardAdminPage onNavigate={navigate} />
    }

    switch (role) {
      case 'ADMIN':
        return <DashboardAdminPage onNavigate={navigate} />
      case 'SCHOOL_ADMIN':
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
