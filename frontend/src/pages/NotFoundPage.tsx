import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <PageContainer>
      <div
        style={{
          maxWidth: '460px',
          margin: 'var(--space-8) auto',
          width: '100%',
        }}
      >
        <Card style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <CardHeader
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              borderBottom: 'none',
              marginBottom: 'var(--space-4)',
              paddingBottom: 0,
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <FileQuestion size={28} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <CardTitle style={{ fontSize: '22px' }}>Page Not Found</CardTitle>
            <CardDescription style={{ marginTop: 'var(--space-2)' }}>
              The requested URL does not exist or has been moved within the Expense Voucher Portal.
            </CardDescription>
          </CardHeader>

          <CardContent style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" icon={<ArrowLeft size={16} />}>
                Return to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
