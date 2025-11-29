import { useEffect, useState, type ReactNode } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { Footer } from '../components/Footer'

import { Breadcrumb, type BreadcrumbItem } from '../components/Breadcrumb'

interface LayoutProps {
  children: ReactNode
  onNavigate: (path: string) => void
  pageTitle?: string
  breadcrumbItems?: BreadcrumbItem[]
}

export function Layout({ children, onNavigate, pageTitle, breadcrumbItems = [] }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 992)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setSidebarOpen((open) => !open)

  return (
    <div className="app-shell d-flex flex-column" style={{ minHeight: '100vh' }}>
      <div className="layout-grid flex-grow-1 position-relative">
        <div className="sidebar_container">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={onNavigate} />
        </div>
        {isSidebarOpen && window.innerWidth < 992 ? <div className="sidebar-backdrop d-lg-none" onClick={() => setSidebarOpen(false)} /> : null}
        <div className="d-flex flex-column">
          <div className="layout-main  p-5">
            <Header onNavigate={onNavigate} onToggleSidebar={toggleSidebar} pageTitle={pageTitle} />
            {breadcrumbItems.length ? <Breadcrumb items={breadcrumbItems} /> : null}
            <main className="flex-grow-1 p-2">{children}</main>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  )
}
