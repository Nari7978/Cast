import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ErrorBoundary from './ErrorBoundary'

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ background: '#F6F7FB' }}>
      <Sidebar />
      <Header />
      <main className="ml-64 pt-[60px] min-h-screen">
        <div className="p-6 animate-fade-in">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
