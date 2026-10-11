import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FileText,
  Save,
  Send,
  ArrowLeft,
  AlertCircle,
  Building,
  UserCheck,
  Calendar,
  IndianRupee,
  RotateCw,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { createVoucher, fetchVoucherById, updateDraftVoucher } from '../../api/voucherApi'
import { PageContainer } from '../../components/layout/PageContainer'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import { FormGroup } from '../../components/ui/FormGroup'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { SignatureUploader } from '../../components/vouchers/SignatureUploader'

const DEPARTMENT_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Administration', label: 'Administration' },
]

const CATEGORY_OPTIONS = [
  { value: 'Travel', label: 'Travel & Commute' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment' },
  { value: 'Office Supplies', label: 'Office Supplies & Stationery' },
  { value: 'Software & Subscriptions', label: 'Software & Cloud Subscriptions' },
  { value: 'Training & Certifications', label: 'Training & Professional Certifications' },
  { value: 'Client Hospitality', label: 'Client Hospitality' },
  { value: 'Miscellaneous', label: 'Miscellaneous Corporate Expense' },
]

export const VoucherFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)

  const { token, user } = useAuth()
  const navigate = useNavigate()

  const todayStr = new Date().toISOString().split('T')[0]

  // Form State
  const [voucherNumber, setVoucherNumber] = useState<string>('')
  const [voucherDate, setVoucherDate] = useState<string>(todayStr)
  const [expenseDate, setExpenseDate] = useState<string>(todayStr)
  const [department, setDepartment] = useState<string>(user?.department || 'Finance')
  const [title, setTitle] = useState<string>('')
  const [category, setCategory] = useState<string>('Travel')
  const [description, setDescription] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [signaturePath, setSignaturePath] = useState<string>('')

  // UI State
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let isMounted = true
    if (!isEditMode || !token || !id) return

    fetchVoucherById(token, id)
      .then((voucher) => {
        if (!isMounted) return
        if (voucher.status !== 'DRAFT') {
          setLoadError(`Voucher ${voucher.voucherNumber} is currently "${voucher.status}". Only DRAFT vouchers can be modified.`)
          setIsLoadingExisting(false)
          return
        }

        setVoucherNumber(voucher.voucherNumber)
        if (voucher.voucherDate) setVoucherDate(voucher.voucherDate.split('T')[0])
        if (voucher.expenseDate) setExpenseDate(voucher.expenseDate.split('T')[0])
        if (voucher.department) setDepartment(voucher.department)
        if (voucher.title) setTitle(voucher.title)
        if (voucher.category) setCategory(voucher.category)
        if (voucher.description) setDescription(voucher.description)
        if (voucher.amount) setAmount(String(voucher.amount))
        if (voucher.employeeSignaturePath) setSignaturePath(voucher.employeeSignaturePath)
        setIsLoadingExisting(false)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load voucher details.')
          setIsLoadingExisting(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isEditMode, token, id])

  // Validation function for Submit action
  const validateForSubmit = (): boolean => {
    const errors: Record<string, string> = {}

    if (!title.trim()) {
      errors.title = 'Expense title is required before submission.'
    }
    if (!department.trim()) {
      errors.department = 'Department is required.'
    }
    if (!expenseDate) {
      errors.expenseDate = 'Expense date is required.'
    }
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Amount must be greater than zero.'
    }
    if (!signaturePath || !signaturePath.trim()) {
      errors.signature = 'Employee signature is mandatory before submitting for approval.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Save as Draft
  const handleSaveDraft = async () => {
    if (!token || isSubmitting) return
    setIsSubmitting(true)
    setActionError(null)
    setFieldErrors({})

    const payload = {
      voucherDate,
      expenseDate,
      department,
      title: title.trim() || 'Untitled Draft',
      category,
      description: description.trim(),
      amount: parseFloat(amount) || 0,
      employeeSignaturePath: signaturePath || null,
      action: 'draft' as const,
    }

    try {
      if (isEditMode && id) {
        await updateDraftVoucher(token, id, payload)
      } else {
        await createVoucher(token, payload)
      }
      navigate('/vouchers')
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save draft.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Submit for Approval
  const handleSubmitVoucher = async () => {
    if (!token || isSubmitting) return
    setActionError(null)

    if (!validateForSubmit()) {
      return
    }

    setIsSubmitting(true)

    const payload = {
      voucherDate,
      expenseDate,
      department,
      title: title.trim(),
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      employeeSignaturePath: signaturePath,
      action: 'submit' as const,
    }

    try {
      let result
      if (isEditMode && id) {
        result = await updateDraftVoucher(token, id, payload)
      } else {
        result = await createVoucher(token, payload)
      }
      navigate(`/vouchers/${result.id}`)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit voucher for approval.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingExisting) {
    return (
      <PageContainer>
        <Card style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RotateCw size={24} className="spin" style={{ margin: '0 auto var(--space-2)' }} />
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Loading draft voucher...</p>
        </Card>
      </PageContainer>
    )
  }

  if (loadError) {
    return (
      <PageContainer>
        <div style={{ maxWidth: '600px', margin: 'var(--space-8) auto' }}>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-danger)' }}>
                <AlertCircle size={20} />
                <CardTitle style={{ color: 'var(--color-danger)' }}>Unable to Edit Voucher</CardTitle>
              </div>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/vouchers')}>
                Return to My Vouchers
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/vouchers')}
          >
            Back to Vouchers List
          </Button>
        </div>

        <SectionHeader
          title={isEditMode ? `Edit Draft Voucher: ${voucherNumber}` : 'Create Expense Voucher'}
          subtitle={
            isEditMode
              ? 'Update draft details, attach your signature, and submit for director approval.'
              : 'Complete expense details. You can save an incomplete form as a Draft at any time.'
          }
        />

        {actionError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              color: 'var(--color-danger)',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Error:</strong> {actionError}
            </div>
          </div>
        )}

        <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              <CardTitle>Expense Voucher Details</CardTitle>
            </div>
            <CardDescription>
              All claims must follow corporate reimbursement policy.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Employee Information Card (Read-only) */}
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
                  Employee Name
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={14} style={{ color: 'var(--color-primary)' }} />
                  {user?.name}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Corporate Email
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                  {user?.email}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  User Department
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={14} style={{ color: 'var(--color-primary)' }} />
                  {user?.department || 'Not Assigned'}
                </div>
              </div>
            </div>

            {/* Dates row */}
            <div className="grid-2">
              <FormGroup
                label="Voucher Date"
                htmlFor="voucher-date"
                helperText="Recorded creation date for audit tracking"
              >
                <Input
                  id="voucher-date"
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  disabled={isSubmitting}
                  leftIcon={<Calendar size={16} />}
                />
              </FormGroup>

              <FormGroup
                label="Expense Incurred Date"
                htmlFor="expense-date"
                required
                error={fieldErrors.expenseDate}
                helperText="Date the expense was incurred"
              >
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => {
                    setExpenseDate(e.target.value)
                    if (fieldErrors.expenseDate) {
                      setFieldErrors((prev) => ({ ...prev, expenseDate: '' }))
                    }
                  }}
                  disabled={isSubmitting}
                  hasError={Boolean(fieldErrors.expenseDate)}
                  leftIcon={<Calendar size={16} />}
                />
              </FormGroup>
            </div>

            {/* Title */}
            <FormGroup
              label="Expense Title"
              htmlFor="voucher-title"
              required
              error={fieldErrors.title}
              helperText="Concise summary (e.g. Q4 Client Presentation Dinner, Mumbai Flights)"
            >
              <Input
                id="voucher-title"
                type="text"
                placeholder="e.g. Annual Cloud Infrastructure Hosting"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: '' }))
                  }
                }}
                disabled={isSubmitting}
                hasError={Boolean(fieldErrors.title)}
              />
            </FormGroup>

            {/* Department and Category row */}
            <div className="grid-2">
              <FormGroup
                label="Department"
                htmlFor="voucher-department"
                required
                error={fieldErrors.department}
              >
                <Select
                  id="voucher-department"
                  options={DEPARTMENT_OPTIONS}
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value)
                    if (fieldErrors.department) {
                      setFieldErrors((prev) => ({ ...prev, department: '' }))
                    }
                  }}
                  disabled={isSubmitting}
                  hasError={Boolean(fieldErrors.department)}
                />
              </FormGroup>

              <FormGroup
                label="Expense Category"
                htmlFor="voucher-category"
              >
                <Select
                  id="voucher-category"
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                />
              </FormGroup>
            </div>

            {/* Amount */}
            <FormGroup
              label="Reimbursement Amount (INR)"
              htmlFor="voucher-amount"
              required
              error={fieldErrors.amount}
              helperText="Must be greater than ₹0.00"
            >
              <Input
                id="voucher-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (fieldErrors.amount) {
                    setFieldErrors((prev) => ({ ...prev, amount: '' }))
                  }
                }}
                disabled={isSubmitting}
                hasError={Boolean(fieldErrors.amount)}
                leftIcon={<IndianRupee size={16} />}
              />
            </FormGroup>

            {/* Description */}
            <FormGroup
              label="Expense Description & Business Justification"
              htmlFor="voucher-description"
              helperText="Detail the business context, attendees, or invoice references"
            >
              <Textarea
                id="voucher-description"
                rows={4}
                placeholder="Explain the purpose of the expense, project association, or client details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </FormGroup>

            {/* Employee Signature Image Uploader */}
            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', fontSize: '14px' }}>
                  Employee Signature Image <span style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Mandatory for final voucher submission. You may save a Draft without uploading your signature now.
                </div>
              </div>

              <SignatureUploader
                currentSignaturePath={signaturePath}
                onSignatureUploaded={(path) => {
                  setSignaturePath(path)
                  if (fieldErrors.signature) {
                    setFieldErrors((prev) => ({ ...prev, signature: '' }))
                  }
                }}
                disabled={isSubmitting}
                required
                error={fieldErrors.signature}
              />
            </div>
          </CardContent>

          <CardFooter style={{ justifyContent: 'space-between', backgroundColor: 'var(--color-surface-subtle)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/vouchers')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button
                type="button"
                variant="secondary"
                icon={<Save size={16} />}
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </Button>

              <Button
                type="button"
                variant="primary"
                icon={<Send size={16} />}
                onClick={handleSubmitVoucher}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  )
}
