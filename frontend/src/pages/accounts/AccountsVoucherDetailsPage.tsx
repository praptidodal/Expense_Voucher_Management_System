import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCw,
  ShieldCheck,
  Tag,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { fetchVoucherById } from '../../api/voucherApi'
import type { Voucher } from '../../types/voucher'
import { PageContainer } from '../../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge, type VoucherStatusType } from '../../components/ui/Badge'
import { AuthenticatedSignatureImage } from '../../components/vouchers/AuthenticatedSignatureImage'

export const AccountsVoucherDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadVoucher = useCallback(async () => {
    if (!token || !id) return
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchVoucherById(token, id)
      setVoucher(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve voucher details.')
    } finally {
      setIsLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    let isMounted = true
    if (!token || !id) return

    fetchVoucherById(token, id)
      .then((data) => {
        if (isMounted) {
          setVoucher(data)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve voucher details.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token, id])

  const formatCurrency = (amt: number | string) => {
    const parsed = parseFloat(String(amt))
    if (isNaN(parsed)) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(parsed)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Card style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RotateCw size={24} className="spin" style={{ margin: '0 auto var(--space-2)' }} />
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Retrieving voucher audit file...</p>
        </Card>
      </PageContainer>
    )
  }

  if (error || !voucher) {
    return (
      <PageContainer>
        <div style={{ maxWidth: '600px', margin: 'var(--space-8) auto' }}>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-danger)' }}>
                <AlertCircle size={20} />
                <CardTitle style={{ color: 'var(--color-danger)' }}>Voucher Not Found</CardTitle>
              </div>
              <CardDescription>{error || 'The requested voucher could not be found in the repository.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" icon={<RotateCw size={14} />} onClick={loadVoucher}>
                  Retry
                </Button>
                <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/accounts')}>
                  Back to Accounts Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  const isApproved = voucher.status === 'APPROVED'
  const isRejected = voucher.status === 'REJECTED'
  const isPending = voucher.status === 'SUBMITTED'
  const isDraft = voucher.status === 'DRAFT'

  return (
    <PageContainer>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        {/* Navigation Breadcrumb Action */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/accounts')}
          >
            Back to Accounts Workspace
          </Button>
        </div>

        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-deep-navy)', margin: 0 }}>
                {voucher.voucherNumber}
              </h1>
              <StatusBadge status={voucher.status.toLowerCase() as VoucherStatusType} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Claimant: <strong>{voucher.employee?.name}</strong> ({voucher.employee?.email}) &bull; Submitted on {formatDate(voucher.createdAt)}
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-deep-navy)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
            <span>Audit Record</span>
          </div>
        </div>

        {/* Status Callout Banner */}
        {isApproved && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-approved-bg)',
              border: '1px solid var(--color-approved-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <CheckCircle2 size={20} style={{ color: 'var(--color-approved-text)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-approved-text)', fontSize: '14px' }}>
                Director Approval Authorized &mdash; Verified for Reimbursement
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Approved on <strong>{formatDateTime(voucher.approvalDate)}</strong> with registered Director signature.
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-rejected-bg)',
              border: '1px solid var(--color-rejected-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <XCircle size={20} style={{ color: 'var(--color-rejected-text)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-rejected-text)', fontSize: '14px' }}>
                Claim Declined by Director
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-deep-navy)', marginTop: '4px', lineHeight: 1.5 }}>
                <strong>Rejection Reason:</strong> {voucher.rejectionReason || 'No reason provided.'}
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-submitted-bg)',
              border: '1px solid var(--color-submitted-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <Clock size={20} style={{ color: 'var(--color-submitted-text)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-submitted-text)', fontSize: '14px' }}>
                Pending Director Decision
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Voucher has been signed and submitted by claimant. Awaiting Director review and authorization signature.
              </div>
            </div>
          </div>
        )}

        {isDraft && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <FileSpreadsheet size={20} style={{ color: 'var(--color-text-muted)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', fontSize: '14px' }}>
                Unsubmitted Draft Voucher
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                This voucher is in draft state and has not been submitted for reimbursement.
              </div>
            </div>
          </div>
        )}

        {/* Main Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          {/* Claimant Particulars Card */}
          <Card>
            <CardHeader style={{ paddingBottom: 'var(--space-2)' }}>
              <CardTitle style={{ fontSize: '15px' }}>Claimant Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '13px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Employee Name
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} style={{ color: 'var(--color-primary)' }} />
                    {voucher.employee?.name || 'Staff Member'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Corporate Email
                  </div>
                  <div style={{ color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                    {voucher.employee?.email || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Department
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={14} style={{ color: 'var(--color-primary)' }} />
                    {voucher.department}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Particulars Card */}
          <Card>
            <CardHeader style={{ paddingBottom: 'var(--space-2)' }}>
              <CardTitle style={{ fontSize: '15px' }}>Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '13px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Reimbursement Amount
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
                    {formatCurrency(voucher.amount)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Expense Date
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} style={{ color: 'var(--color-text-muted)' }} />
                      {formatDate(voucher.expenseDate)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Category
                    </div>
                    <div style={{ fontWeight: 500, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={13} style={{ color: 'var(--color-text-muted)' }} />
                      {voucher.category || 'General'}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Voucher Date
                  </div>
                  <div style={{ color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                    {formatDate(voucher.voucherDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claim Title and Description Card */}
        <Card style={{ marginBottom: 'var(--space-5)' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '16px' }}>Expense Claim Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Expense Title
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '4px' }}>
                {voucher.title}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Detailed Description &amp; Business Justification
              </div>
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '13px',
                  color: 'var(--color-deep-navy)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {voucher.description || 'No detailed description was provided by the employee.'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dual Signatures Verification Panel */}
        <Card style={{ marginBottom: 'var(--space-5)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
              <CardTitle style={{ fontSize: '16px' }}>Dual Signature Verification Panel</CardTitle>
            </div>
            <CardDescription>
              Inspection of claimant signature and Director approval authorization for reimbursement compliance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
              {/* Employee Signature Block */}
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-surface-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                    Employee / Claimant Signature
                  </div>
                  {voucher.employeeSignaturePath ? (
                    <span style={{ fontSize: '11px', color: 'var(--color-approved-text)', backgroundColor: 'var(--color-approved-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                      Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      Not Recorded
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  Signed by {voucher.employee?.name || 'Claimant'}
                </div>

                <div
                  style={{
                    height: '140px',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {voucher.employeeSignaturePath ? (
                    <AuthenticatedSignatureImage
                      signaturePath={voucher.employeeSignaturePath}
                      alt="Employee Signature"
                      style={{ maxHeight: '120px', maxWidth: '90%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      <FileText size={24} style={{ margin: '0 auto var(--space-1)' }} />
                      <p>No employee signature on file</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Director Signature Block */}
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-surface-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                    Director Approval Signature
                  </div>
                  {voucher.directorSignaturePath ? (
                    <span style={{ fontSize: '11px', color: 'var(--color-approved-text)', backgroundColor: 'var(--color-approved-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                      Authorized
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--color-submitted-text)', backgroundColor: 'var(--color-submitted-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>
                      {isRejected ? 'Declined' : 'Pending Authorization'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  {voucher.approvalDate
                    ? `Authorized on ${formatDateTime(voucher.approvalDate)}`
                    : isRejected
                      ? 'Decision: Claim Rejected'
                      : 'Pending Director decision'}
                </div>

                <div
                  style={{
                    height: '140px',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {voucher.directorSignaturePath ? (
                    <AuthenticatedSignatureImage
                      signaturePath={voucher.directorSignaturePath}
                      alt="Director Signature"
                      style={{ maxHeight: '120px', maxWidth: '90%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      <FileCheck2 size={24} style={{ margin: '0 auto var(--space-1)' }} />
                      <p>{isApproved ? 'No director signature recorded' : 'Awaiting Director signature'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Compliance Footer Card */}
        <Card style={{ backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', marginBottom: 'var(--space-8)' }}>
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                <strong>Accounts Compliance:</strong> Record ID: <code style={{ fontSize: '11px' }}>{voucher.id}</code> &bull; Created: {formatDateTime(voucher.createdAt)} &bull; Last Updated: {formatDateTime(voucher.updatedAt)}
              </div>
              <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/accounts')}>
                Back to Accounts Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
