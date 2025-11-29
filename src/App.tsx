import { useEffect, useState } from 'react'
import './App.css'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { DashboardAdminPage } from './pages/DashboardAdminPage'
import { DashboardScholarAdminPage } from './pages/DashboardScholarAdminPage'
import { DashboardTeacherPage } from './pages/DashboardTeacherPage'
import { DashboardStudentsPage } from './pages/DashboardStudentsPage'
import { KitchenPage } from './pages/KitchenPage'

function Router() {
  const [path, setPath] = useState(window.location.pathname)
  const { token, role } = useAuth()

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  useEffect(() => {
    if (!token && path === '/portal') {
      navigate('/login')
    }
  }, [path, token])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (path === '/login') {
    return <LoginPage onNavigate={navigate} />
  }

  if (path === '/portal' && token) {
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
