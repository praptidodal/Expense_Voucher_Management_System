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
  Check,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { fetchVoucherById, approveVoucher, rejectVoucher } from '../../api/voucherApi'
import type { Voucher } from '../../types/voucher'
import { PageContainer } from '../../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { StatusBadge, type VoucherStatusType } from '../../components/ui/Badge'
import { AuthenticatedSignatureImage } from '../../components/vouchers/AuthenticatedSignatureImage'
import { SignatureUploader } from '../../components/vouchers/SignatureUploader'

export const DirectorVoucherReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Decision Modals State
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false)
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false)

  // Approval state
  const [directorSignaturePath, setDirectorSignaturePath] = useState<string>('')
  const [approveError, setApproveError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState<boolean>(false)

  // Rejection state
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [isRejecting, setIsRejecting] = useState<boolean>(false)

  // Decision success feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

  // Execute approval
  const handleConfirmApproval = async () => {
    if (!token || !voucher || isApproving) return
    setApproveError(null)

    if (!directorSignaturePath.trim()) {
      setApproveError('You must upload your Director signature image before approving.')
      return
    }

    setIsApproving(true)
    try {
      const updated = await approveVoucher(token, voucher.id, directorSignaturePath)
      setVoucher(updated)
      setShowApproveModal(false)
      setSuccessMessage('Voucher approved successfully and forwarded for reimbursement.')
    } catch (err: unknown) {
      setApproveError(err instanceof Error ? err.message : 'Failed to approve voucher.')
    } finally {
      setIsApproving(false)
    }
  }

  // Execute rejection
  const handleConfirmRejection = async () => {
    if (!token || !voucher || isRejecting) return
    setRejectError(null)

    if (!rejectionReason.trim()) {
      setRejectError('A non-empty rejection reason is required.')
      return
    }

    setIsRejecting(true)
    try {
      const updated = await rejectVoucher(token, voucher.id, rejectionReason.trim())
      setVoucher(updated)
      setShowRejectModal(false)
      setSuccessMessage('Voucher rejected successfully.')
    } catch (err: unknown) {
      setRejectError(err instanceof Error ? err.message : 'Failed to reject voucher.')
    } finally {
      setIsRejecting(false)
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
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Retrieving voucher for director review...</p>
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
              <CardDescription>{error || 'The requested voucher could not be found.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" icon={<RotateCw size={14} />} onClick={loadVoucher}>
                  Retry
                </Button>
                <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/director')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  const isPending = voucher.status === 'SUBMITTED'
  const isApproved = voucher.status === 'APPROVED'
  const isRejected = voucher.status === 'REJECTED'
  const isDraft = voucher.status === 'DRAFT'

  return (
    <PageContainer>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/director')}
          >
            Back to Director Queue
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

          {/* Decision Action Buttons for Submitted Vouchers */}
          {isPending && (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="primary"
                icon={<Check size={16} />}
                onClick={() => {
                  setApproveError(null)
                  setShowApproveModal(true)
                }}
              >
                Approve Voucher
              </Button>
              <Button
                variant="destructive"
                icon={<X size={16} />}
                onClick={() => {
                  setRejectError(null)
                  setShowRejectModal(true)
                }}
              >
                Reject Voucher
              </Button>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div
            role="status"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-approved-bg)',
              border: '1px solid var(--color-approved-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-approved-text)',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-5)',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Status Context Banner */}
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
            <Clock size={18} style={{ color: 'var(--color-submitted-text)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-submitted-text)', fontSize: '14px' }}>
                Pending Director Authorization
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-submitted-text)', marginTop: '2px', lineHeight: 1.4 }}>
                This voucher was signed and submitted by {voucher.employee?.name}. As Director, you may approve it by attaching your signature or reject it with mandatory remarks. Employee fields are strictly immutable.
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
                Voucher Approved &bull; Authorized for Reimbursement
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-approved-text)', marginTop: '2px', lineHeight: 1.4 }}>
                Approved on {formatDate(voucher.approvalDate)}. Dual signatures verified. This record is permanently archived and visible to the Accounts team.
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
                Voucher Rejected
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-rejected-text)', marginTop: '4px', lineHeight: 1.4 }}>
                <strong>Rejection Remarks:</strong> {voucher.rejectionReason || 'No specific remarks recorded.'}
              </div>
            </div>
          </div>
        )}

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
                Unsubmitted Draft
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-draft-text)', marginTop: '2px' }}>
                This voucher is currently in Draft status and has not been submitted for approval by the employee yet.
              </div>
            </div>
          </div>
        )}

        {/* Read-Only Voucher Details Card */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              <CardTitle>{voucher.title}</CardTitle>
            </div>
            <CardDescription>
              Claimant: {voucher.employee?.name} &bull; Department: {voucher.department} &bull; Category: {voucher.category || 'General'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Claimant Info Strip */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                marginBottom: 'var(--space-5)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-3)',
                fontSize: '13px',
              }}
            >
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Claimant Employee
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} style={{ color: 'var(--color-primary)' }} />
                  {voucher.employee?.name}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Corporate Email
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                  {voucher.employee?.email}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Claimant Department
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={14} style={{ color: 'var(--color-primary)' }} />
                  {voucher.department}
                </div>
              </div>
            </div>

            {/* Financial Details Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-4)',
                paddingBottom: 'var(--space-5)',
                borderBottom: '1px solid var(--color-border-subtle)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Claimed Amount
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                  {formatCurrency(voucher.amount)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Expense Date
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
                  {voucher.category || 'General'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Voucher Date
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '4px' }}>
                  {formatDate(voucher.voucherDate)}
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Business Justification &amp; Notes
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
                {voucher.description || 'No detailed remarks provided.'}
              </div>
            </div>

            {/* Dual Signatures Inspection Strip */}
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
                  Employee Signature (Claimant)
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
                    }}
                  >
                    No employee signature uploaded
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Signed by: <strong>{voucher.employee?.name}</strong>
                </div>
              </div>

              {/* Director Signature Block */}
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
                    Approved on: {formatDateTime(voucher.approvalDate)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter style={{ backgroundColor: 'var(--color-surface-subtle)', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <div>Audit Created: {formatDateTime(voucher.createdAt)}</div>
            <div>Last Updated: {formatDateTime(voucher.updatedAt)}</div>
          </CardFooter>
        </Card>
      </div>

      {/* Approval Confirmation Modal */}
      {showApproveModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay"
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: '540px',
            }}
          >
            <div style={{ padding: 'var(--space-6)' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-approved-bg)',
                  color: 'var(--color-approved-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <Check size={20} strokeWidth={2.5} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-1)' }}>
                Approve Voucher: {voucher.voucherNumber}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                You are about to authorize reimbursement of <strong>{formatCurrency(voucher.amount)}</strong> for claimant{' '}
                <strong>{voucher.employee?.name}</strong>. Please upload your Director signature image to confirm.
              </p>

              {approveError && (
                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-danger-subtle)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-danger)',
                    fontSize: '13px',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {approveError}
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-2)' }}>
                  Director Signature Image <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <SignatureUploader
                  currentSignaturePath={directorSignaturePath}
                  onSignatureUploaded={(path) => {
                    setDirectorSignaturePath(path)
                    setApproveError(null)
                  }}
                  disabled={isApproving}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowApproveModal(false)
                    setApproveError(null)
                  }}
                  disabled={isApproving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmApproval}
                  disabled={isApproving}
                  icon={isApproving ? <RotateCw size={14} className="spin" /> : <Check size={14} />}
                >
                  {isApproving ? 'Authorizing...' : 'Confirm Approval'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay"
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: '520px',
            }}
          >
            <div style={{ padding: 'var(--space-6)' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-danger-subtle)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <X size={20} strokeWidth={2.5} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-1)' }}>
                Reject Voucher: {voucher.voucherNumber}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                Please provide a clear business reason for declining this expense claim. This remark will be visible to the employee.
              </p>

              {rejectError && (
                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-danger-subtle)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-danger)',
                    fontSize: '13px',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {rejectError}
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label
                  htmlFor="rejection-reason"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-2)' }}
                >
                  Rejection Reason &amp; Remarks <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <Textarea
                  id="rejection-reason"
                  rows={4}
                  placeholder="e.g. Non-reimbursable item according to section 4 of the employee travel policy..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value)
                    if (rejectError) setRejectError(null)
                  }}
                  disabled={isRejecting}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectError(null)
                  }}
                  disabled={isRejecting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmRejection}
                  disabled={isRejecting}
                  icon={isRejecting ? <RotateCw size={14} className="spin" /> : <X size={14} />}
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
