import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, AlertTriangle, DollarSign, Percent, Target } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface PositionSizeResult {
  positionSize: number
  positionValue: number
  riskAmount: number
  riskPercent: number
  shares: number
  entryPrice: number
  stopLossPrice: number
  targetPrice: number
  riskRewardRatio: number
}

export function PositionSizeCalculator() {
  const [accountSize, setAccountSize] = useState('10000')
  const [riskPercent, setRiskPercent] = useState('1')
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [riskAmount, setRiskAmount] = useState('')
  const [fixedShares, setFixedShares] = useState('')
  const [method, setMethod] = useState<'risk_percent' | 'risk_amount' | 'fixed_shares'>('risk_percent')

  const result = useMemo<PositionSizeResult | null>(() => {
    const account = parseFloat(accountSize) || 0
    const entry = parseFloat(entryPrice) || 0
    const stop = parseFloat(stopLoss) || 0
    const target = parseFloat(targetPrice) || 0
    const riskPct = parseFloat(riskPercent) || 0
    const riskAmt = parseFloat(riskAmount) || 0

    if (!account || !entry) return null

    let calculatedRiskAmount = 0
    let calculatedShares = 0
    const calculatedStopLoss = stop

    if (method === 'risk_percent') {
      if (!riskPct) return null
      calculatedRiskAmount = account * (riskPct / 100)
      if (stop && entry) {
        const riskPerShare = Math.abs(entry - stop)
        if (riskPerShare > 0) {
          calculatedShares = calculatedRiskAmount / riskPerShare
        }
      }
    } else if (method === 'risk_amount') {
      if (!riskAmt) return null
      calculatedRiskAmount = riskAmt
      if (stop && entry) {
        const riskPerShare = Math.abs(entry - stop)
        if (riskPerShare > 0) {
          calculatedShares = calculatedRiskAmount / riskPerShare
        }
      }
    } else {
      // fixed_shares - calculate risk from shares
      if (!entry || !stop) return null
      const sharesInput = parseFloat(fixedShares) || 0
      if (sharesInput <= 0) return null
      calculatedShares = sharesInput
      const riskPerShare = Math.abs(entry - stop)
      calculatedRiskAmount = calculatedShares * riskPerShare
    }

    if (calculatedShares <= 0 || !entry) return null

    const positionValue = calculatedShares * entry
    const actualRiskPercent = account > 0 ? (calculatedRiskAmount / account) * 100 : 0
    const riskReward = target && entry && stop
      ? Math.abs(target - entry) / Math.abs(entry - stop)
      : 0

    return {
      positionSize: calculatedShares,
      positionValue,
      riskAmount: calculatedRiskAmount,
      riskPercent: actualRiskPercent,
      shares: Math.floor(calculatedShares),
      entryPrice: entry,
      stopLossPrice: calculatedStopLoss,
      targetPrice: target,
      riskRewardRatio: riskReward,
    }
  }, [accountSize, riskPercent, entryPrice, stopLoss, targetPrice, riskAmount, fixedShares, method])

  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          <Calculator size={24} style={{ color: 'var(--color-primary)' }} />
          <h2 className="chart-title" style={{ margin: 0 }}>Position Size Calculator</h2>
        </div>

        <div className="form-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="input-group">
            <label htmlFor="calc-account">
              <DollarSign size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
              Account Size ($)
            </label>
            <Input
              id="calc-account"
              type="number"
              step="0.01"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
              placeholder="10000"
            />
          </div>

          <div className="input-group">
            <label htmlFor="calc-entry">
              <TrendingUp size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
              Entry Price ($)
            </label>
            <Input
              id="calc-entry"
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="100.00"
            />
          </div>

          <div className="input-group">
            <label htmlFor="calc-stop">
              <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
              Stop Loss ($)
            </label>
            <Input
              id="calc-stop"
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="95.00"
            />
          </div>

          <div className="input-group">
            <label htmlFor="calc-target">
              <Target size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
              Target Price ($) <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(optional)</span>
            </label>
            <Input
              id="calc-target"
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="110.00"
            />
          </div>
        </div>

        <div className="form-section" style={{ gridColumn: '1 / -1', marginBottom: 'var(--space-4)' }}>
          <h3 className="form-section__title">Calculation Method</h3>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${method === 'risk_percent' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setMethod('risk_percent')}
          >
            <Percent size={16} />
            Risk %
          </button>
          <button
            type="button"
            className={`btn ${method === 'risk_amount' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setMethod('risk_amount')}
          >
            <DollarSign size={16} />
            Risk Amount
          </button>
          <button
            type="button"
            className={`btn ${method === 'fixed_shares' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setMethod('fixed_shares')}
          >
            Fixed Shares
          </button>
        </div>

        {method === 'risk_percent' && (
          <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label htmlFor="calc-risk-percent">
              <Percent size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
              Risk per Trade (%)
            </label>
            <Input
              id="calc-risk-percent"
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              placeholder="1.0"
            />
            <span className="input-helper">Recommended: 1-2% per trade</span>
          </div>
        )}

        {method === 'risk_amount' && (
          <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label htmlFor="calc-risk-amount">
              <DollarSign size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />
              Risk Amount ($)
            </label>
            <Input
              id="calc-risk-amount"
              type="number"
              step="0.01"
              value={riskAmount}
              onChange={(e) => setRiskAmount(e.target.value)}
              placeholder="100.00"
            />
          </div>
        )}

        {method === 'fixed_shares' && (
          <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label htmlFor="calc-shares">Number of Shares</label>
            <Input
              id="calc-shares"
              type="number"
              step="1"
              value={fixedShares}
              onChange={(e) => setFixedShares(e.target.value)}
              placeholder="100"
            />
            <span className="input-helper">Enter number of shares to calculate risk</span>
          </div>
        )}

        {result && (
          <div style={{
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}>
            <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
              Results
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Position Size
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                  {result.shares.toLocaleString()} shares
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Position Value
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                  ${result.positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Risk Amount
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-error)' }}>
                  ${result.riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Risk %
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: result.riskPercent > 2 ? 'var(--color-error)' : 'var(--color-text)' }}>
                  {result.riskPercent.toFixed(2)}%
                </div>
              </div>
              {result.targetPrice && result.riskRewardRatio > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                    Risk:Reward Ratio
                  </div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: result.riskRewardRatio >= 2 ? 'var(--color-success)' : 'var(--color-text)' }}>
                    1:{result.riskRewardRatio.toFixed(2)}
                  </div>
                </div>
              )}
              {result.stopLossPrice && result.entryPrice && result.entryPrice > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                    Stop Distance
                  </div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                    {Math.abs(((result.entryPrice - result.stopLossPrice) / result.entryPrice) * 100).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>

            {result.riskPercent > 2 && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'var(--color-error-muted)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}>
                <AlertTriangle size={18} />
                <span>Warning: Risk exceeds 2% of account. Consider reducing position size.</span>
              </div>
            )}

            {result.targetPrice && result.riskRewardRatio > 0 && result.riskRewardRatio < 1.5 && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'var(--color-primary-muted)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-primary-hover)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}>
                <AlertTriangle size={18} />
                <span>Low risk:reward ratio. Consider adjusting target or stop loss.</span>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
