import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 992)
  const [isSidebarOpen, setSidebarOpen] = useState(() => !isMobileView)

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 992)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setSidebarOpen(!isMobileView)
  }, [isMobileView])

  useEffect(() => {
    if (isMobileView && isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileView, isSidebarOpen])

  const toggleSidebar = () => setSidebarOpen((open) => !open)

  const shouldHideContent = useMemo(() => isMobileView && isSidebarOpen, [isMobileView, isSidebarOpen])

  return (
    <div className="app-shell d-flex flex-column" style={{ minHeight: '100vh' }}>
      <div className="layout-grid flex-grow-1 position-relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={onNavigate} />
        {!shouldHideContent ? (
          <div
            className="d-flex flex-column"
            style={{
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <div className="layout-main p-5 d-flex flex-column" style={{ overflow: 'hidden' }}>
              <Header onNavigate={onNavigate} onToggleSidebar={toggleSidebar} pageTitle={pageTitle} />
              {breadcrumbItems.length ? <Breadcrumb items={breadcrumbItems} /> : null}
              <main className="flex-grow-1" style={{ overflowY: 'auto' }}>
                {children}
              </main>
            </div>
            <Footer />
          </div>
        ) : null}
      </div>
    </div>
  )
}
