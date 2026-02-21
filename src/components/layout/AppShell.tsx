import { useState } from 'react'
import { Link, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  Tag,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Calculator,
  Calendar,
  GitCompare,
  Grid3x3,
  Clock,
  PlusCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { getDisplayName, getShortDisplayName } from '@/utils/displayName'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trades', label: 'Trades', icon: TrendingUp },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/heatmap', label: 'Heatmap', icon: Grid3x3 },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/strategies', label: 'Strategies', icon: Target },
  { path: '/tags', label: 'Tags', icon: Tag },
  { path: '/sessions', label: 'Market Sessions', icon: Clock },
  { path: '/calculator', label: 'Calculator', icon: Calculator },
]

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const closeSidebar = () => setSidebarOpen(false)
  
  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <button
          type="button"
          className="app-shell__menu-btn"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="app-shell__title">Trading Journal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <ThemeToggle />
          <div className="app-shell__user-wrap">
            <button
              type="button"
              className="app-shell__user-btn"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <User size={20} />
              <span>{getShortDisplayName(user)}</span>
            </button>
            {userMenuOpen && (
              <>
                <div
                  className="app-shell__backdrop"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden
                />
                <div className="app-shell__dropdown">
                  <div className="app-shell__dropdown-item app-shell__dropdown-item--static">
                    {getDisplayName(user)}
                  </div>
                  <button type="button" className="app-shell__dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <aside className={`app-shell__sidebar ${sidebarOpen ? 'app-shell__sidebar--open' : ''}`}>
        <nav className="app-shell__nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`app-shell__nav-link ${isActive ? 'app-shell__nav-link--active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
          <Link
            to="/trades/new"
            className="app-shell__nav-link app-shell__nav-link--add"
            onClick={closeSidebar}
          >
            <PlusCircle size={20} />
            New Trade Entry
          </Link>
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="app-shell__sidebar-backdrop" onClick={closeSidebar} aria-hidden />
      )}

      <main className="app-shell__main">
        <AnimatedOutlet />
      </main>
    </div>
  )
}

function AnimatedOutlet() {
  const outlet = useOutlet()
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ width: '100%' }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
