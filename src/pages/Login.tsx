import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody } from '@/components/ui/Card'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const [apiError, setApiError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  if (user) {
    navigate(from, { replace: true })
    return null
  }

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    try {
      await login(data.username, data.password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null
      setApiError(message ?? 'Invalid credentials')
    }
  }

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <CardBody>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Trading Journal</p>
          {apiError && (
            <div className="alert alert--error" role="alert">
              {apiError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <Input
              label="Username"
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" variant="primary" disabled={isSubmitting} className="auth-submit">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="auth-footer">
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
