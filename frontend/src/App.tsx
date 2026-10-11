import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { EmployeeVouchersPage } from './pages/employee/EmployeeVouchersPage'
import { VoucherFormPage } from './pages/employee/VoucherFormPage'
import { VoucherDetailsPage } from './pages/employee/VoucherDetailsPage'
import { DirectorDashboardPage } from './pages/director/DirectorDashboardPage'
import { DirectorVoucherReviewPage } from './pages/director/DirectorVoucherReviewPage'
import { AccountsDashboardPage } from './pages/accounts/AccountsDashboardPage'
import { AccountsVoucherDetailsPage } from './pages/accounts/AccountsVoucherDetailsPage'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProtectedRoute } from './components/routing/ProtectedRoute'
import { useAuth } from './context/useAuth'

const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  switch (user.role) {
    case 'DIRECTOR':
      return <Navigate to="/director" replace />
    case 'ACCOUNTS':
      return <Navigate to="/accounts" replace />
    case 'EMPLOYEE':
    default:
      return <Navigate to="/vouchers" replace />
  }
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Role-based root and dashboard redirection */}
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Dashboard route redirects to user's role-specific workspace */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<RoleBasedRedirect />} />
        </Route>

        {/* Employee Voucher Management Routes */}
        <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
          <Route path="/vouchers" element={<EmployeeVouchersPage />} />
          <Route path="/vouchers/new" element={<VoucherFormPage />} />
          <Route path="/vouchers/:id" element={<VoucherDetailsPage />} />
          <Route path="/vouchers/:id/edit" element={<VoucherFormPage />} />
        </Route>

        {/* Director Review & Decision Routes */}
        <Route element={<ProtectedRoute allowedRoles={['DIRECTOR']} />}>
          <Route path="/director" element={<DirectorDashboardPage />} />
          <Route path="/director/vouchers/:id" element={<DirectorVoucherReviewPage />} />
        </Route>

        {/* Accounts Audit & Verification Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ACCOUNTS']} />}>
          <Route path="/accounts" element={<AccountsDashboardPage />} />
          <Route path="/accounts/vouchers/:id" element={<AccountsVoucherDetailsPage />} />
        </Route>

        {/* Development Reference (Preserved per instructions) */}
        <Route path="/design-system" element={<DesignSystemPage />} />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
