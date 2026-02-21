import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody } from '@/components/ui/Card'

const schema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function Register() {
  const [apiError, setApiError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { register: doRegister, user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    try {
      await doRegister({
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        email: data.email || undefined,
        password: data.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const res =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: Record<string, unknown> } }).response?.data
          : null
      const msg =
        res && typeof res === 'object'
          ? (Array.isArray((res as { username?: string[] }).username)
              ? (res as { username: string[] }).username?.[0]
              : (res as { email?: string[] }).email?.[0]) ?? 'Registration failed'
          : 'Registration failed'
      setApiError(msg)
    }
  }

  return (
    <div className="auth-page">
      <Card className="auth-card auth-card--register">
        <CardBody className="auth-card__body">
          <div className="auth-header">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Start tracking your trades in minutes</p>
          </div>
          {apiError && (
            <div className="alert alert--error" role="alert">
              {apiError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form auth-form--register">
            <div className="auth-form__section">
              <span className="auth-form__section-label">Your name</span>
              <div className="auth-form__row">
                <Input
                  label="First name"
                  autoComplete="given-name"
                  autoFocus
                  error={errors.first_name?.message}
                  {...register('first_name')}
                />
                <Input
                  label="Last name"
                  autoComplete="family-name"
                  error={errors.last_name?.message}
                  {...register('last_name')}
                />
              </div>
            </div>
            <div className="auth-form__section">
              <span className="auth-form__section-label">Account</span>
              <Input
                label="Username"
                autoComplete="username"
                error={errors.username?.message}
                {...register('username')}
              />
              <Input
                label="Email (optional)"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="auth-form__section">
              <span className="auth-form__section-label">Password</span>
              <div className="auth-form__row">
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Confirm"
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="auth-submit">
              {isSubmitting ? 'Creating account…' : 'Sign up'}
            </Button>
            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
