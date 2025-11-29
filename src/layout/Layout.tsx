import { useEffect, useState, type ReactNode } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { Footer } from '../components/Footer'

interface LayoutProps {
  children: ReactNode
  onNavigate: (path: string) => void
}

export function Layout({ children, onNavigate }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 992)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setSidebarOpen((open) => !open)

  return (
    <div className="app-shell d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header onNavigate={onNavigate} onToggleSidebar={toggleSidebar} />
      <div className="layout-grid flex-grow-1 position-relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        {isSidebarOpen && window.innerWidth < 992 ? <div className="sidebar-backdrop d-lg-none" onClick={() => setSidebarOpen(false)} /> : null}
        <div className="layout-main d-flex flex-column">
          <main className="flex-grow-1 content-area">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
