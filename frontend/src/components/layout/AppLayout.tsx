import React from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

export const AppLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <footer className="app-footer">
        Expense Desk &bull; Voucher Management System
      </footer>
    </div>
  )
}
