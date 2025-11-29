import { useEffect, useState } from 'react'
import './App.css'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PortalPage } from './pages/PortalPage'

function Router() {
  const [path, setPath] = useState(window.location.pathname)
  const { token } = useAuth()

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
    return <PortalPage onNavigate={navigate} />
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
