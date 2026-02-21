/**
 * Trade logic: win/loss from profit amount and price direction.
 * Profit amount is entered by user.
 */

export type TradeSide = 'long' | 'short'

/** Expected outcome from prices only (sign of move). */
export function getExpectedOutcome(
  side: TradeSide,
  entryPrice: number,
  exitPrice: number
): 'win' | 'loss' | 'breakeven' {
  if (!Number.isFinite(entryPrice) || !Number.isFinite(exitPrice)) return 'breakeven'
  const diff = exitPrice - entryPrice
  if (diff === 0) return 'breakeven'
  if (side === 'long') return diff > 0 ? 'win' : 'loss'
  return diff < 0 ? 'win' : 'loss'
}

/** Outcome from actual profit amount value. */
export function getOutcomeFromPnl(pnl: number): 'win' | 'loss' | 'breakeven' {
  if (!Number.isFinite(pnl) || pnl === 0) return 'breakeven'
  return pnl > 0 ? 'win' : 'loss'
}

/** Check if entered profit amount sign matches the direction implied by side and prices. */
export function pnlSignMatchesPrices(
  side: TradeSide,
  entryPrice: number,
  exitPrice: number,
  pnl: number
): boolean {
  const expected = getExpectedOutcome(side, entryPrice, exitPrice)
  const actual = getOutcomeFromPnl(pnl)
  return expected === actual
}

/**
 * Calculate risk/reward ratio from stop loss.
 * Risk = |entry_price - stop_loss| × quantity
 * R/R = profit_amount / risk
 * Falls back to amount_risked if stop_loss/quantity not available.
 * Returns null if risk cannot be calculated or is 0.
 */
export function computeRrFromStopLoss(
  profitAmount: number,
  entryPrice: number | null | undefined,
  stopLoss: number | null | undefined,
  quantity: number | null | undefined,
  side: TradeSide | null | undefined,
  amountRisked: number | null | undefined
): number | null {
  if (!Number.isFinite(profitAmount)) return null
  
  let risk: number | null = null
  
  // Calculate risk from stop loss if all required fields are provided
  if (
    entryPrice != null &&
    stopLoss != null &&
    quantity != null &&
    side != null &&
    Number.isFinite(entryPrice) &&
    Number.isFinite(stopLoss) &&
    Number.isFinite(quantity) &&
    quantity > 0
  ) {
    if (side === 'long') {
      risk = Math.abs(entryPrice - stopLoss) * quantity
    } else {
      risk = Math.abs(stopLoss - entryPrice) * quantity
    }
  }
  
  // Fall back to amount_risked if stop_loss calculation not available
  if (risk == null && amountRisked != null && Number.isFinite(amountRisked) && amountRisked > 0) {
    risk = amountRisked
  }
  
  // Calculate R/R if we have risk
  if (risk != null && risk > 0) {
    return Math.round((profitAmount / risk) * 10000) / 10000
  }
  
  return null
}

/** Risk as % of total capital. Returns null if either value missing or capital is 0. */
export function riskPercentOfCapital(
  totalCapital: number | null | undefined,
  amountRisked: number | null | undefined
): number | null {
  if (
    totalCapital == null ||
    amountRisked == null ||
    !Number.isFinite(totalCapital) ||
    !Number.isFinite(amountRisked) ||
    totalCapital <= 0
  )
    return null
  return Math.round((amountRisked / totalCapital) * 10000) / 100
}

/** Return on capital % = (pnl / total_capital) * 100. Returns null if capital missing or 0. */
export function returnOnCapitalPercent(
  pnl: number,
  totalCapital: number | null | undefined
): number | null {
  if (
    totalCapital == null ||
    !Number.isFinite(totalCapital) ||
    totalCapital <= 0 ||
    !Number.isFinite(pnl)
  )
    return null
  return Math.round((pnl / totalCapital) * 10000) / 100
}

/**
 * Auto-calculate profit from trade details using quantity.
 * Long: (exit_price - entry_price) * quantity * leverage
 * Short: (entry_price - exit_price) * quantity * leverage
 * Returns null if required values are missing.
 */
export function calculateProfit(
  side: TradeSide,
  entryPrice: number | null | undefined,
  exitPrice: number | null | undefined,
  quantity: number | null | undefined,
  leverage: number | null | undefined = 1
): number | null {
  if (
    entryPrice == null ||
    exitPrice == null ||
    quantity == null ||
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(exitPrice) ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null
  }

  const lev = leverage != null && Number.isFinite(leverage) && leverage > 0 ? leverage : 1
  const priceDiff = side === 'long' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice
  
  return Math.round((priceDiff * quantity * lev) * 100) / 100
}

/**
 * Auto-calculate profit from trade details using amount invested.
 * Long: (exit_price - entry_price) / entry_price * amount_invested * leverage
 * Short: (entry_price - exit_price) / entry_price * amount_invested * leverage
 * Returns null if required values are missing.
 */
export function calculateProfitFromAmount(
  side: TradeSide,
  entryPrice: number | null | undefined,
  exitPrice: number | null | undefined,
  amountInvested: number | null | undefined,
  leverage: number | null | undefined = 1
): number | null {
  if (
    entryPrice == null ||
    exitPrice == null ||
    amountInvested == null ||
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(exitPrice) ||
    !Number.isFinite(amountInvested) ||
    amountInvested <= 0 ||
    entryPrice <= 0
  ) {
    return null
  }

  const lev = leverage != null && Number.isFinite(leverage) && leverage > 0 ? leverage : 1
  const priceDiff = side === 'long' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice
  const percentChange = priceDiff / entryPrice
  
  return Math.round((percentChange * amountInvested * lev) * 100) / 100
}

export function getBestProfitCalculation(
  side: TradeSide,
  entryPrice: number | null | undefined,
  exitPrice: number | null | undefined,
  quantity: number | null | undefined,
  amountInvested: number | null | undefined,
  leverage: number | null | undefined = 1
): { profit: number | null; method: 'quantity' | 'amount' | null } {
  const profitFromQuantity = calculateProfit(side, entryPrice, exitPrice, quantity, leverage)
  if (profitFromQuantity != null) {
    return { profit: profitFromQuantity, method: 'quantity' }
  }

  const profitFromAmount = calculateProfitFromAmount(side, entryPrice, exitPrice, amountInvested, leverage)
  if (profitFromAmount != null) {
    return { profit: profitFromAmount, method: 'amount' }
  }

  return { profit: null, method: null }
}

export function calculateAmountRisked(
  side: TradeSide,
  entryPrice: number | null | undefined,
  stopLoss: number | null | undefined,
  quantity: number | null | undefined,
  leverage: number | null | undefined = 1
): number | null {
  if (
    entryPrice == null ||
    stopLoss == null ||
    quantity == null ||
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(stopLoss) ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null
  }

  const lev = leverage != null && Number.isFinite(leverage) && leverage > 0 ? leverage : 1
  const distance = side === 'long'
    ? entryPrice - stopLoss
    : stopLoss - entryPrice
  const risk = Math.abs(distance) * quantity * lev
  return Math.round(risk * 100) / 100
}
