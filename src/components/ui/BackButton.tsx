import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from './Button'

interface Props {
  fallback?: string
  className?: string
}

export function BackButton({ fallback = '/dashboard', className = '' }: Props) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className={className}
      style={{ marginBottom: 'var(--space-4)' }}
    >
      <ArrowLeft size={18} />
      Back
    </Button>
  )
}
