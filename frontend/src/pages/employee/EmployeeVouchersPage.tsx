import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Receipt,
  Clock,
  CheckCircle2,
  FileEdit,
  Eye,
  Trash2,
  AlertCircle,
  RotateCw,
  IndianRupee,
  Layers,
  Search,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { fetchMyVouchers, deleteDraftVoucher } from '../../api/voucherApi'
import type { Voucher } from '../../types/voucher'
import { PageContainer } from '../../components/layout/PageContainer'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatusBadge, type VoucherStatusType } from '../../components/ui/Badge'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest Expense Date' },
  { value: 'date-asc', label: 'Oldest Expense Date' },
  { value: 'amount-desc', label: 'Amount: High to Low' },
  { value: 'amount-asc', label: 'Amount: Low to High' },
]

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'Travel', label: 'Travel & Commute' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment' },
  { value: 'Office Supplies', label: 'Office Supplies & Stationery' },
  { value: 'Software & Subscriptions', label: 'Software & Subscriptions' },
  { value: 'Training & Certifications', label: 'Training & Certifications' },
  { value: 'Client Hospitality', label: 'Client Hospitality' },
  { value: 'Miscellaneous', label: 'Miscellaneous' },
]

export const EmployeeVouchersPage: React.FC = () => {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortSetting, setSortSetting] = useState<string>('date-desc')

  // Deletion modal state
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadVouchers = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchMyVouchers(token)
      setVouchers(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load vouchers from server.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    let isMounted = true
    if (!token) return

    fetchMyVouchers(token)
      .then((data) => {
        if (isMounted) {
          setVouchers(data)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load vouchers from server.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  // Statistics
  const stats = useMemo(() => {
    const total = vouchers.length
    const draft = vouchers.filter((v) => v.status === 'DRAFT').length
    const pending = vouchers.filter((v) => v.status === 'SUBMITTED').length
    const approved = vouchers.filter((v) => v.status === 'APPROVED').length
    const rejected = vouchers.filter((v) => v.status === 'REJECTED').length
    const totalAmount = vouchers.reduce((sum, v) => sum + parseFloat(String(v.amount) || '0'), 0)

    return { total, draft, pending, approved, rejected, totalAmount }
  }, [vouchers])

  // Filtered and sorted vouchers
  const filteredVouchers = useMemo(() => {
    let result = [...vouchers]

    // Status filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((v) => v.status === selectedStatus)
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter((v) => v.category === categoryFilter)
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      result = result.filter(
        (v) =>
          v.voucherNumber.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          (v.category && v.category.toLowerCase().includes(q)) ||
          (v.department && v.department.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q))
      )
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortSetting) {
        case 'date-asc':
          return new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime()
        case 'amount-desc':
          return parseFloat(String(b.amount) || '0') - parseFloat(String(a.amount) || '0')
        case 'amount-asc':
          return parseFloat(String(a.amount) || '0') - parseFloat(String(b.amount) || '0')
        case 'date-desc':
        default:
          return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
      }
    })

    return result
  }, [vouchers, selectedStatus, categoryFilter, searchTerm, sortSetting])

  const handleDeleteDraft = async () => {
    if (!token || !deletingVoucher) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteDraftVoucher(token, deletingVoucher.id)
      setVouchers((prev) => prev.filter((v) => v.id !== deletingVoucher.id))
      setDeletingVoucher(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete draft voucher.')
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

  const formatDate = (dateStr: string) => {
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

  return (
    <PageContainer>
      <SectionHeader
        title="My Vouchers"
        subtitle="Create expense vouchers, manage drafts, and track submission statuses"
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/vouchers/new')}
          >
            Create Voucher
          </Button>
        }
      />

      {/* Responsive Overview KPI Cards (All 6 assignment metrics) */}
      <div className="kpi-grid-6" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Total Claims */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-border-strong)',
            backgroundColor: selectedStatus === 'ALL' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedStatus('ALL')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Claims
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                {stats.total}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
              <Receipt size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            All vouchers created by you
          </div>
        </Card>

        {/* Drafts */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-draft-border)',
            backgroundColor: selectedStatus === 'DRAFT' ? 'var(--color-draft-bg)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'DRAFT' ? 'ALL' : 'DRAFT')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Drafts
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-draft-text)', marginTop: '2px' }}>
                {stats.draft}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-draft-bg)', color: 'var(--color-draft-text)' }}>
              <FileEdit size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Editable &amp; deletable drafts
          </div>
        </Card>

        {/* Pending Approval */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-submitted-border)',
            backgroundColor: selectedStatus === 'SUBMITTED' ? 'var(--color-submitted-bg)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Review
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-submitted-text)', marginTop: '2px' }}>
                {stats.pending}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-submitted-bg)', color: 'var(--color-submitted-text)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Awaiting Director approval
          </div>
        </Card>

        {/* Approved Claims */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-approved-border)',
            backgroundColor: selectedStatus === 'APPROVED' ? 'var(--color-approved-bg)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'APPROVED' ? 'ALL' : 'APPROVED')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Approved
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-approved-text)', marginTop: '2px' }}>
                {stats.approved}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-approved-bg)', color: 'var(--color-approved-text)' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Authorized for reimbursement
          </div>
        </Card>

        {/* Rejected Claims */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-rejected-border)',
            backgroundColor: selectedStatus === 'REJECTED' ? 'var(--color-rejected-bg)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'REJECTED' ? 'ALL' : 'REJECTED')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rejected
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-rejected-text)', marginTop: '2px' }}>
                {stats.rejected}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-rejected-bg)', color: 'var(--color-rejected-text)' }}>
              <XCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Declined expense vouchers
          </div>
        </Card>

        {/* Claimed Total */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Claimed Total
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-deep-navy)', marginTop: '4px' }}>
                {formatCurrency(stats.totalAmount)}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', color: 'var(--color-deep-navy)' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Cumulative claims value
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div>
            <Input
              type="text"
              placeholder="Search by voucher #, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          {/* Category Filter */}
          <div>
            <Select
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>

          {/* Sort Selector */}
          <div>
            <Select
              options={SORT_OPTIONS}
              value={sortSetting}
              onChange={(e) => setSortSetting(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border-subtle)',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'ALL', label: 'All Vouchers', count: stats.total },
            { key: 'DRAFT', label: 'Drafts', count: stats.draft },
            { key: 'SUBMITTED', label: 'Pending Approval', count: stats.pending },
            { key: 'APPROVED', label: 'Approved', count: stats.approved },
            { key: 'REJECTED', label: 'Rejected', count: stats.rejected },
          ].map((tab) => {
            const isActive = selectedStatus === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatus(tab.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  padding: 'var(--space-2) var(--space-4)',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'var(--color-surface-subtle)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-5)',
            color: 'var(--color-danger)',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCw size={14} />} onClick={loadVouchers}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Card style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RotateCw size={24} className="spin" style={{ margin: '0 auto var(--space-2)' }} />
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Loading employee vouchers...</p>
        </Card>
      ) : filteredVouchers.length === 0 ? (
        /* Empty state */
        <Card style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            {searchTerm || selectedStatus !== 'ALL' || categoryFilter !== 'ALL' ? <XCircle size={28} /> : <Layers size={28} />}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-1)' }}>
            {searchTerm || selectedStatus !== 'ALL' || categoryFilter !== 'ALL' ? 'No Matching Vouchers' : 'No Expense Vouchers Found'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto var(--space-6)' }}>
            {searchTerm || selectedStatus !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No vouchers match your selected filters or search terms. Try clearing search or resetting filters.'
              : 'You have not created any expense vouchers yet. Click below to draft your first reimbursement voucher.'}
          </p>
          {searchTerm || selectedStatus !== 'ALL' || categoryFilter !== 'ALL' ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('')
                setSelectedStatus('ALL')
                setCategoryFilter('ALL')
              }}
            >
              Reset Filters
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => navigate('/vouchers/new')}
            >
              Create Your First Voucher
            </Button>
          )}
        </Card>
      ) : (
        /* Vouchers Data Table */
        <Card style={{ overflow: 'hidden' }}>
          <div className="table-scroll-hint">
            <Layers size={13} /> Scroll horizontally to view all columns
          </div>
          <div className="table-scroll-wrapper">
            <table className="table" style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Voucher #
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Expense Date
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                    Title &amp; Category
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Department
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    Amount
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Status
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((voucher) => {
                  const isDraft = voucher.status === 'DRAFT'
                  return (
                    <tr
                      key={voucher.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/vouchers/${voucher.id}`}
                          style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                        >
                          {voucher.voucherNumber}
                        </Link>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(voucher.expenseDate)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)' }}>{voucher.title}</div>
                        {voucher.category && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{voucher.category}</div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                        {voucher.department}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                        {formatCurrency(voucher.amount)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <StatusBadge status={voucher.status.toLowerCase() as VoucherStatusType} />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye size={13} />}
                            onClick={() => navigate(`/vouchers/${voucher.id}`)}
                            title="View Voucher Details"
                          >
                            View
                          </Button>

                          {isDraft && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<FileEdit size={13} />}
                                onClick={() => navigate(`/vouchers/${voucher.id}/edit`)}
                                title="Edit Draft Voucher"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={13} />}
                                onClick={() => setDeletingVoucher(voucher)}
                                title="Delete Draft Voucher"
                                style={{ color: 'var(--color-danger)' }}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVoucher && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay"
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '480px' }}
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
                <Trash2 size={20} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-2)' }}>
                Delete Draft Voucher
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                Are you sure you want to delete draft voucher{' '}
                <strong>{deletingVoucher.voucherNumber}</strong> ({deletingVoucher.title})? This action cannot be undone.
              </p>

              {deleteError && (
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
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDeletingVoucher(null)
                    setDeleteError(null)
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteDraft}
                  disabled={isDeleting}
                  icon={isDeleting ? <RotateCw size={14} className="spin" /> : <Trash2 size={14} />}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
