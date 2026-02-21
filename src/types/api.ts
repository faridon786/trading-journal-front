// Auth
export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface RegisterResponse {
  user: User
  access: string
  refresh: string
}

// Trades
export type TradeSide = 'long' | 'short'

export interface Trade {
  id: number
  symbol: number
  symbol_name: string
  side: TradeSide
  entry_price: string
  exit_price: string
  stop_loss: string | null
  quantity: string | null
  entry_date: string
  exit_date: string
  pnl: string
  rr: string | null
  leverage: string | null
  total_capital: string | null
  amount_risked: string | null
  notes: string
  strategy: number | null
  strategy_name: string | null
  tags: Tag[]
  tag_ids?: number[]
  emotion_rating: number | null
  emotion_notes: string
  pre_trade_plan: string
  post_trade_review: string
  screenshot: string | null
  is_paper: boolean
}

export interface TradeCreateInput {
  symbol: number
  side: TradeSide
  entry_price: number | string
  exit_price: number | string
  stop_loss?: number | string | null
  quantity?: number | string | null
  entry_date: string
  exit_date: string
  pnl: number | string
  rr?: number | string | null
  leverage?: number | string | null
  total_capital?: number | string | null
  amount_risked?: number | string | null
  notes?: string
  strategy?: number | null
  tag_ids?: number[]
  emotion_rating?: number | null
  emotion_notes?: string
  pre_trade_plan?: string
  post_trade_review?: string
  is_paper?: boolean
}

// Strategies, Symbols & Tags
export interface Strategy {
  id: number
  name: string
}

export interface Symbol {
  id: number
  name: string
}

export interface Tag {
  id: number
  name: string
}

export interface TradeTemplate {
  id: number
  name: string
  symbol: string
  side: 'long' | 'short' | ''
  strategy: number | null
  strategy_name: string | null
  tags: Tag[]
  tag_ids?: number[]
  notes: string
  pre_trade_plan: string
  is_paper: boolean
  created_at: string
  updated_at: string
}

// Paginated list (DRF PageNumberPagination)
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Analytics
export interface AnalyticsSummary {
  total_pnl: number
  win_count: number
  loss_count: number
  total_trades: number
  win_rate: number | null
  avg_win: number | null
  avg_loss: number | null
  profit_factor: number | null
  expectancy: number | null
  current_streak: number
  current_streak_type: 'win' | 'loss' | null
  longest_win_streak: number
  longest_loss_streak: number
  max_drawdown: number
  max_drawdown_duration_days: number | null
  sharpe_ratio: number | null
}

export interface EquityCurvePoint {
  date: string
  cumulative_pnl: number
}

export interface DrawdownPoint {
  date: string
  equity: number
  drawdown: number
}

export interface CalendarTrade {
  date: string
  total_pnl: number
  count: number
  trades: Array<{
    id: number
    symbol: string
    side: string
    pnl: number
    strategy: string | null
  }>
}

export interface HeatmapData {
  day_of_week: number // 0-6 (Mon-Sun)
  hour: number // 0-23
  wins: number
  losses: number
  total_pnl: number
  count: number
}

export interface BySymbolItem {
  symbol: string
  pnl: number
  count: number
}

export interface ByStrategyItem {
  strategy: string
  pnl: number
  count: number
}

export interface ByPeriodItem {
  period: string | null
  pnl: number
  count: number
}
