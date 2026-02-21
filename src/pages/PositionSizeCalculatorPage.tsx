import { PositionSizeCalculator } from '@/components/PositionSizeCalculator'
import { BackButton } from '@/components/ui/BackButton'

export function PositionSizeCalculatorPage() {
  return (
    <div>
      <BackButton fallback="/dashboard" />
      <header className="page-header">
        <h1 className="page-header__title">Position Size Calculator</h1>
        <p className="page-header__subtitle">
          Calculate optimal position size based on risk management principles
        </p>
      </header>
      <PositionSizeCalculator />
    </div>
  )
}
