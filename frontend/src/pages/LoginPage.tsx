import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, ShieldAlert, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { FormGroup } from '../components/ui/FormGroup'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

interface FormErrors {
  identifier?: string
  password?: string
}

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getSafeDestination = (userRole: string, requestedPath?: string): string => {
    if (requestedPath && requestedPath !== '/' && requestedPath !== '/dashboard' && requestedPath !== '/login') {
      if (requestedPath.startsWith('/director') && userRole === 'DIRECTOR') return requestedPath
      if (requestedPath.startsWith('/vouchers') && userRole === 'EMPLOYEE') return requestedPath
      if (requestedPath.startsWith('/accounts') && userRole === 'ACCOUNTS') return requestedPath
    }
    switch (userRole) {
      case 'DIRECTOR':
        return '/director'
      case 'ACCOUNTS':
        return '/accounts'
      case 'EMPLOYEE':
      default:
        return '/vouchers'
    }
  }

  // Redirect to role home if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      const target = getSafeDestination(user.role, from)
      navigate(target, { replace: true })
    }
  }, [isAuthenticated, user, navigate, location])

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}
    const trimmed = identifier.trim()

    if (!trimmed) {
      nextErrors.identifier = 'Corporate email or user ID is required.'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    } else if (password.length < 6) {
      nextErrors.password = 'Password must contain at least 6 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validate() || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const authenticatedUser = await login(identifier.trim(), password)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      const target = getSafeDestination(authenticatedUser.role, from)
      navigate(target, { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError('An unexpected authentication error occurred.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <div
        style={{
          maxWidth: '460px',
          margin: 'var(--space-6) auto',
          width: '100%',
        }}
      >
        <Card style={{ boxShadow: 'var(--shadow-md)' }}>
          <CardHeader style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-1)',
              }}
            >
              <Lock size={22} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div>
              <CardTitle style={{ fontSize: '20px' }}>Sign In</CardTitle>
              <CardDescription>
                Use your company credentials to access Expense Desk.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {submitError && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--color-danger-subtle)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-5)',
                  fontSize: '13px',
                  color: 'var(--color-danger)',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>Authentication Error</div>
                  {submitError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormGroup
                label="Corporate Email or User ID"
                htmlFor="login-identifier"
                required
                error={errors.identifier}
                helperText={!errors.identifier ? 'e.g. employee@prachay.com or director@prachay.com' : undefined}
              >
                <Input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }))
                    if (submitError) setSubmitError(null)
                  }}
                  disabled={isSubmitting}
                  hasError={Boolean(errors.identifier)}
                  leftIcon={<Mail size={16} />}
                  placeholder="name@company.com"
                  aria-describedby={errors.identifier ? 'login-identifier-error' : 'login-identifier-helper'}
                />
              </FormGroup>

              <FormGroup
                label="Password"
                htmlFor="login-password"
                required
                error={errors.password}
              >
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                    if (submitError) setSubmitError(null)
                  }}
                  disabled={isSubmitting}
                  hasError={Boolean(errors.password)}
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  placeholder="Enter your password"
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                />
              </FormGroup>

              <div style={{ marginTop: 'var(--space-6)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>

            <div
              style={{
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-border-subtle)',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: '4px' }}>
                <ShieldAlert size={14} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                Local Test Accounts
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li><code>employee@prachay.com</code> (Employee role)</li>
                <li><code>director@prachay.com</code> (Director role)</li>
                <li><code>accounts@prachay.com</code> (Accounts role)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
