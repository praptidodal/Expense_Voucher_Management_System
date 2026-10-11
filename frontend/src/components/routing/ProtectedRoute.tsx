import React from 'react'
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import type { Role } from '../../types/auth'
import { PageContainer } from '../layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '15px', fontWeight: 500 }}>Verifying corporate session...</p>
        </div>
      </PageContainer>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <PageContainer>
        <div style={{ maxWidth: '520px', margin: 'var(--space-8) auto' }}>
          <Card>
            <CardHeader style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-danger-subtle)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldAlert size={22} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div>
                <CardTitle style={{ color: 'var(--color-danger)' }}>Access Restricted</CardTitle>
                <CardDescription>
                  Your current account role does not have authorization to view this section.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                Authenticated as <strong>{user.name}</strong> ({user.role}). Required role: <strong>{allowedRoles.join(' or ')}</strong>.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    const target = user.role === 'DIRECTOR' ? '/director' : user.role === 'ACCOUNTS' ? '/accounts' : '/vouchers'
                    navigate(target)
                  }}
                >
                  Return to My Workspace
                </Button>
                <Button variant="secondary" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
