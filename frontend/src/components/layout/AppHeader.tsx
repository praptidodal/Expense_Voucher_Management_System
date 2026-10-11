import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, User as UserIcon, LogOut } from 'lucide-react'
import { useAuth } from '../../context/useAuth'

export const AppHeader: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Brand identity */}
        <div className="app-header-left">
          <Link
            to={
              isAuthenticated && user
                ? user.role === 'DIRECTOR'
                  ? '/director'
                  : user.role === 'ACCOUNTS'
                    ? '/accounts'
                    : '/vouchers'
                : '/login'
            }
            className="app-header-brand"
            style={{ textDecoration: 'none' }}
          >
            <div className="app-header-logo">
              <Building2 size={20} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div>
              <div className="app-header-title">Expense Desk</div>
            </div>
          </Link>

          {/* Navigation Links for Authenticated Employee */}
          {isAuthenticated && user?.role === 'EMPLOYEE' && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Link
                to="/vouchers"
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: 500 }}
              >
                My Vouchers
              </Link>
            </nav>
          )}

          {/* Navigation Links for Authenticated Director */}
          {isAuthenticated && user?.role === 'DIRECTOR' && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Link
                to="/director"
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: 500 }}
              >
                Dashboard
              </Link>
            </nav>
          )}

          {/* Navigation Links for Authenticated Accounts */}
          {isAuthenticated && user?.role === 'ACCOUNTS' && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Link
                to="/accounts"
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: 500 }}
              >
                Vouchers
              </Link>
            </nav>
          )}
        </div>

        {/* Right side compact user area */}
        <div className="app-header-actions">
          {isAuthenticated && user ? (
            <div className="app-header-user-badge" style={{ borderLeft: 'none', paddingLeft: 0 }}>
              <div className="app-header-user-avatar">
                <UserIcon size={16} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div className="app-header-user-info">
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {user.role}{user.department ? ` • ${user.department}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="btn btn-ghost btn-sm"
                style={{
                  marginLeft: 'var(--space-2)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                }}
                title="Sign out of your session"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
