import type { ReactNode } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { Footer } from '../components/Footer'

interface LayoutProps {
  children: ReactNode
  onNavigate: (path: string) => void
}

export function Layout({ children, onNavigate }: LayoutProps) {
  return (
    <div className="app-shell d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header onNavigate={onNavigate} />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 content-area">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
