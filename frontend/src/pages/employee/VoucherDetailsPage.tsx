import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Building,
  FileText,
  FileEdit,
  Send,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCw,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { fetchVoucherById, submitDraftVoucher, deleteDraftVoucher } from '../../api/voucherApi'
import type { Voucher } from '../../types/voucher'
import { PageContainer } from '../../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge, type VoucherStatusType } from '../../components/ui/Badge'
import { AuthenticatedSignatureImage } from '../../components/vouchers/AuthenticatedSignatureImage'

export const VoucherDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Submission & deletion action states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

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

  const handleSubmit = async () => {
    if (!token || !voucher || isSubmitting) return
    setActionError(null)

    if (!voucher.employeeSignaturePath) {
      setActionError('Cannot submit: An employee signature image is required. Please edit this draft to upload your signature first.')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await submitDraftVoucher(token, voucher.id)
      setVoucher(updated)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit voucher.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !voucher || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteDraftVoucher(token, voucher.id)
      navigate('/vouchers')
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete draft.')
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

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
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Retrieving voucher details...</p>
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
              <CardDescription>{error || 'The requested voucher could not be found or you do not have permission to view it.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" icon={<RotateCw size={14} />} onClick={loadVoucher}>
                  Retry
                </Button>
                <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/vouchers')}>
                  Back to My Vouchers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  const isDraft = voucher.status === 'DRAFT'
  const isSubmitted = voucher.status === 'SUBMITTED'
  const isApproved = voucher.status === 'APPROVED'
  const isRejected = voucher.status === 'REJECTED'

  return (
    <PageContainer>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/vouchers')}
          >
            Back to My Vouchers
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
              Created on {formatDate(voucher.voucherDate)} &bull; Expense date: {formatDate(voucher.expenseDate)}
            </div>
          </div>

          {/* Quick Actions for Draft */}
          {isDraft && (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<FileEdit size={14} />}
                onClick={() => navigate(`/vouchers/${voucher.id}/edit`)}
              >
                Edit Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Send size={14} />}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => setShowDeleteModal(true)}
                style={{ color: 'var(--color-danger)' }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {actionError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '13px',
              marginBottom: 'var(--space-5)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Workflow Lifecycle Status Banner */}
        {isDraft && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-draft-bg)',
              border: '1px solid var(--color-draft-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <Clock size={18} style={{ color: 'var(--color-draft-text)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-draft-text)', fontSize: '14px' }}>
                Draft Status — Unsubmitted
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-draft-text)', marginTop: '2px', lineHeight: 1.4 }}>
                This voucher is in Draft status. You can edit any field, update the signature, or delete this draft. Once submitted, it enters the approval workflow and cannot be modified.
              </div>
            </div>
          </div>
        )}

        {isSubmitted && (
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
            <Clock size={18} style={{ color: 'var(--color-submitted-text)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-submitted-text)', fontSize: '14px' }}>
                Pending Director Approval
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-submitted-text)', marginTop: '2px', lineHeight: 1.4 }}>
                This voucher has been submitted with your employee signature and is awaiting Director review. All details are locked from further editing.
              </div>
            </div>
          </div>
        )}

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
            <CheckCircle2 size={18} style={{ color: 'var(--color-approved-text)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-approved-text)', fontSize: '14px' }}>
                Approved by Director &bull; Forwarded to Accounts
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-approved-text)', marginTop: '2px', lineHeight: 1.4 }}>
                This expense voucher was approved on {formatDate(voucher.approvalDate)}. It is currently visible to the Accounts team for corporate reimbursement processing.
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
            <XCircle size={18} style={{ color: 'var(--color-rejected-text)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-rejected-text)', fontSize: '14px' }}>
                Voucher Rejected by Director
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-rejected-text)', marginTop: '4px', lineHeight: 1.4 }}>
                <strong>Rejection Reason:</strong> {voucher.rejectionReason || 'No specific remarks provided.'}
              </div>
            </div>
          </div>
        )}

        {/* Main Details Card */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              <CardTitle>{voucher.title}</CardTitle>
            </div>
            <CardDescription>
              Claim Category: {voucher.category || 'General Expense'} &bull; Department: {voucher.department}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Grid of basic fields */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-5)',
                paddingBottom: 'var(--space-5)',
                borderBottom: '1px solid var(--color-border-subtle)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reimbursement Amount
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                  {formatCurrency(voucher.amount)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Department
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} style={{ color: 'var(--color-primary)' }} />
                  {voucher.department}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Expense Incurred Date
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
                  {formatDate(voucher.expenseDate)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Expense Category
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={15} style={{ color: 'var(--color-primary)' }} />
                  {voucher.category || 'Not specified'}
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Expense Description &amp; Business Justification
              </div>
              <div
                style={{
                  backgroundColor: 'var(--color-surface-subtle)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'var(--color-deep-navy)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {voucher.description || 'No detailed description provided.'}
              </div>
            </div>

            {/* Signature Verification Blocks */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'var(--space-4)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              {/* Employee Signature Block */}
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-3)' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                  Employee Signature
                </div>

                {voucher.employeeSignaturePath ? (
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--color-border-strong)',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    <AuthenticatedSignatureImage
                      signaturePath={voucher.employeeSignaturePath}
                      alt="Employee Signature"
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      textAlign: 'center',
                      backgroundColor: 'var(--color-draft-bg)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-draft-text)',
                      fontSize: '12px',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    No employee signature uploaded yet.
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Signed by: <strong>{voucher.employee?.name || user?.name}</strong>
                </div>
              </div>

              {/* Director Signature Block (Only if approved) */}
              {isApproved && voucher.directorSignaturePath && (
                <div
                  style={{
                    border: '1px solid var(--color-approved-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--color-approved-bg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-approved-text)', marginBottom: 'var(--space-3)' }}>
                    <CheckCircle2 size={16} />
                    Director Approval Signature
                  </div>

                  <div
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--color-approved-border)',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    <AuthenticatedSignatureImage
                      signaturePath={voucher.directorSignaturePath}
                      alt="Director Signature"
                    />
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--color-approved-text)' }}>
                    Approved on: {formatDate(voucher.approvalDate)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {/* Audit Metadata Footer */}
          <CardFooter style={{ backgroundColor: 'var(--color-surface-subtle)', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <div>
              Audit Created: {formatDateTime(voucher.createdAt)}
            </div>
            <div>
              Last Updated: {formatDateTime(voucher.updatedAt)}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay"
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: '480px',
              padding: 'var(--space-6)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-2)' }}>
              Delete Draft Voucher
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 'var(--space-5)' }}>
              Are you sure you want to permanently delete draft voucher <strong>{voucher.voucherNumber}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                icon={isDeleting ? <RotateCw size={14} className="spin" /> : <Trash2 size={14} />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Draft'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
