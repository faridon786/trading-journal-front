/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'

const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const TradesPage = lazy(() => import('@/pages/TradesPage').then((m) => ({ default: m.TradesPage })))
const TradeFormPage = lazy(() => import('@/pages/TradeFormPage').then((m) => ({ default: m.TradeFormPage })))
const TradeDetailPage = lazy(() => import('@/pages/TradeDetailPage').then((m) => ({ default: m.TradeDetailPage })))
const StrategiesPage = lazy(() => import('@/pages/StrategiesPage').then((m) => ({ default: m.StrategiesPage })))
const TagsPage = lazy(() => import('@/pages/TagsPage').then((m) => ({ default: m.TagsPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const PositionSizeCalculatorPage = lazy(() =>
  import('@/pages/PositionSizeCalculatorPage').then((m) => ({ default: m.PositionSizeCalculatorPage }))
)
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const CompareTradesPage = lazy(() => import('@/pages/CompareTradesPage').then((m) => ({ default: m.CompareTradesPage })))
const HeatmapPage = lazy(() => import('@/pages/HeatmapPage').then((m) => ({ default: m.HeatmapPage })))
const MarketSessionsPage = lazy(() =>
  import('@/pages/MarketSessionsPage').then((m) => ({ default: m.MarketSessionsPage }))
)

function PageFallback() {
  return (
    <div className="loading-state" style={{ minHeight: '200px' }}>
      <Spinner />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading…</span>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageFallback />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: <Suspense fallback={<PageFallback />}><Dashboard /></Suspense> },
          { path: 'trades', element: <Suspense fallback={<PageFallback />}><TradesPage /></Suspense> },
          { path: 'trades/new', element: <Suspense fallback={<PageFallback />}><TradeFormPage /></Suspense> },
          { path: 'trades/:id/edit', element: <Suspense fallback={<PageFallback />}><TradeFormPage /></Suspense> },
          { path: 'trades/:id', element: <Suspense fallback={<PageFallback />}><TradeDetailPage /></Suspense> },
          { path: 'strategies', element: <Suspense fallback={<PageFallback />}><StrategiesPage /></Suspense> },
          { path: 'tags', element: <Suspense fallback={<PageFallback />}><TagsPage /></Suspense> },
          { path: 'analytics', element: <Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense> },
          { path: 'calendar', element: <Suspense fallback={<PageFallback />}><CalendarPage /></Suspense> },
          { path: 'compare', element: <Suspense fallback={<PageFallback />}><CompareTradesPage /></Suspense> },
          { path: 'heatmap', element: <Suspense fallback={<PageFallback />}><HeatmapPage /></Suspense> },
          { path: 'sessions', element: <Suspense fallback={<PageFallback />}><MarketSessionsPage /></Suspense> },
          { path: 'calculator', element: <Suspense fallback={<PageFallback />}><PositionSizeCalculatorPage /></Suspense> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
