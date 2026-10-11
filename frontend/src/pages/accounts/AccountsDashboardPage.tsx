import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RotateCw,
  Layers,
  Eye,
  IndianRupee,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { fetchAllVouchers } from '../../api/voucherApi'
import type { Voucher, DirectorStats } from '../../types/voucher'
import { PageContainer } from '../../components/layout/PageContainer'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatusBadge, type VoucherStatusType } from '../../components/ui/Badge'

const DEPARTMENT_OPTIONS = [
  { value: 'ALL', label: 'All Departments' },
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
  { value: 'ALL', label: 'All Categories' },
  { value: 'Travel', label: 'Travel & Commute' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment' },
  { value: 'Office Supplies', label: 'Office Supplies & Stationery' },
  { value: 'Software & Subscriptions', label: 'Software & Subscriptions' },
  { value: 'Training & Certifications', label: 'Training & Certifications' },
  { value: 'Client Hospitality', label: 'Client Hospitality' },
  { value: 'Miscellaneous', label: 'Miscellaneous' },
]

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'expenseDate_desc', label: 'Expense Date (Recent)' },
  { value: 'expenseDate_asc', label: 'Expense Date (Oldest)' },
  { value: 'amount_desc', label: 'Amount (High to Low)' },
  { value: 'amount_asc', label: 'Amount (Low to High)' },
  { value: 'voucherNumber_desc', label: 'Voucher Number (Desc)' },
  { value: 'voucherNumber_asc', label: 'Voucher Number (Asc)' },
]

export const AccountsDashboardPage: React.FC = () => {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialStatus = searchParams.get('status') || 'ALL'
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [sortSetting, setSortSetting] = useState<string>('createdAt_desc')

  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [stats, setStats] = useState<DirectorStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
    totalPendingAmount: 0,
    totalApprovedAmount: 0,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Sync url param if status changed
  useEffect(() => {
    const currentParam = searchParams.get('status')
    if (statusFilter !== 'ALL') {
      if (currentParam !== statusFilter) {
        setSearchParams({ status: statusFilter })
      }
    } else if (currentParam) {
      setSearchParams({})
    }
  }, [statusFilter, searchParams, setSearchParams])

  const loadData = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)

    const [sortBy, sortOrder] = sortSetting.split('_') as [string, 'asc' | 'desc']

    try {
      const data = await fetchAllVouchers(token, {
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        sortBy,
        sortOrder,
      })
      setVouchers(data.vouchers)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load vouchers.')
    } finally {
      setIsLoading(false)
    }
  }, [
    token,
    debouncedSearch,
    statusFilter,
    departmentFilter,
    categoryFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortSetting,
  ])

  useEffect(() => {
    let isMounted = true
    if (!token) return

    const [sortBy, sortOrder] = sortSetting.split('_') as [string, 'asc' | 'desc']

    fetchAllVouchers(token, {
      search: debouncedSearch.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      sortBy,
      sortOrder,
    })
      .then((data) => {
        if (isMounted) {
          setVouchers(data.vouchers)
          if (data.stats) {
            setStats(data.stats)
          }
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load vouchers.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [
    token,
    debouncedSearch,
    statusFilter,
    departmentFilter,
    categoryFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortSetting,
  ])

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

  const resetAllFilters = () => {
    setSearchTerm('')
    setDepartmentFilter('ALL')
    setCategoryFilter('ALL')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setStatusFilter('ALL')
  }

  const hasActiveFilters = Boolean(
    searchTerm ||
      departmentFilter !== 'ALL' ||
      categoryFilter !== 'ALL' ||
      startDate ||
      endDate ||
      minAmount ||
      maxAmount ||
      statusFilter !== 'ALL'
  )

  return (
    <PageContainer>
      <SectionHeader
        title="Accounts Workspace"
        subtitle="Review vouchers, verify signatures and track approvals"
        actions={
          <Button variant="secondary" size="sm" icon={<RotateCw size={14} />} onClick={loadData}>
            Refresh
          </Button>
        }
      />

      {/* KPI Summary Cards (Section 8 Accounts Dashboard metrics) */}
      <div className="kpi-grid-5" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Total Vouchers */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-border-strong)',
            backgroundColor: statusFilter === 'ALL' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setStatusFilter('ALL')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Vouchers
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                {stats.total}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', color: 'var(--color-primary)' }}>
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Organization-wide ledger
          </div>
        </Card>

        {/* Pending Approval */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-submitted-border)',
            backgroundColor: statusFilter === 'SUBMITTED' ? 'var(--color-submitted-bg)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setStatusFilter(statusFilter === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Approval
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
            Awaiting Director decision
          </div>
        </Card>

        {/* Approved Vouchers */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-approved-border)',
            backgroundColor: statusFilter === 'APPROVED' ? 'var(--color-approved-bg)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Approved Vouchers
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

        {/* Rejected Vouchers */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-rejected-border)',
            backgroundColor: statusFilter === 'REJECTED' ? 'var(--color-rejected-bg)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rejected Vouchers
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

        {/* Total Approved Expense Amount */}
        <Card
          style={{
            padding: 'var(--space-4)',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Approved Amount
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-deep-navy)', marginTop: '4px' }}>
                {formatCurrency(stats.totalApprovedAmount)}
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', color: 'var(--color-primary)' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Disbursement expenditure
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar (Section 7 Search & Filter Criteria) */}
      <Card style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {/* Row 1: Search, Department, Category, Sort */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'center',
            marginBottom: 'var(--space-3)',
          }}
        >
          {/* Search Input */}
          <div>
            <Input
              type="text"
              placeholder="Search voucher #, claimant, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          {/* Department Filter */}
          <div>
            <Select
              options={DEPARTMENT_OPTIONS}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
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

        {/* Row 2: Date Range & Amount Range */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'center',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <div>
            <Input
              type="date"
              placeholder="From Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Filter expense start date"
            />
          </div>

          <div>
            <Input
              type="date"
              placeholder="To Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Filter expense end date"
            />
          </div>

          <div>
            <Input
              type="number"
              placeholder="Min Amount (₹)"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              title="Minimum expense amount"
            />
          </div>

          <div>
            <Input
              type="number"
              placeholder="Max Amount (₹)"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              title="Maximum expense amount"
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
            { key: 'APPROVED', label: 'Recent Approved Vouchers', count: stats.approved },
            { key: 'SUBMITTED', label: 'Pending Review', count: stats.pending },
            { key: 'REJECTED', label: 'Rejected', count: stats.rejected },
            { key: 'DRAFT', label: 'Drafts', count: stats.draft },
          ].map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-text-inverse)' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-subtle)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
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

      {/* Error Alert */}
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
          <div>{error}</div>
          <Button variant="secondary" size="sm" icon={<RotateCw size={14} />} onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Card style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RotateCw size={24} className="spin" style={{ margin: '0 auto var(--space-2)' }} />
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Loading vouchers repository...</p>
        </Card>
      ) : vouchers.length === 0 ? (
        /* Empty State */
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
            <Layers size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-deep-navy)', marginBottom: 'var(--space-1)' }}>
            No Matching Vouchers Found
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto var(--space-4)' }}>
            {hasActiveFilters
              ? 'Try adjusting your search criteria or resetting filters to view all vouchers.'
              : 'There are currently no expense vouchers in the system.'}
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" onClick={resetAllFilters}>
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        /* Accounts Vouchers Audit Table */
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
              {statusFilter === 'APPROVED' ? 'Recent Approved Vouchers' : 'Organization Vouchers Audit Ledger'} ({vouchers.length} {vouchers.length === 1 ? 'record' : 'records'})
            </span>
          </div>
          <div className="table-scroll-hint">
            <Layers size={13} /> Scroll horizontally to inspect full table columns
          </div>
          <div className="table-scroll-wrapper">
            <table className="table" style={{ width: '100%', minWidth: '960px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Voucher #
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                    Claimant
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Department
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                    Title &amp; Category
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Expense Date
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    Amount
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                    Status
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Signatures
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-deep-navy)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => {
                  const isApproved = voucher.status === 'APPROVED'
                  const hasEmpSig = Boolean(voucher.employeeSignaturePath)
                  const hasDirSig = Boolean(voucher.directorSignaturePath)

                  return (
                    <tr
                      key={voucher.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: isApproved ? 'rgba(236, 253, 245, 0.25)' : undefined,
                        transition: 'background-color 0.15s ease',
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                        {voucher.voucherNumber}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                          {voucher.employee?.name || 'Staff Member'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {voucher.employee?.email}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                        {voucher.department}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)' }}>
                          {voucher.title}
                        </div>
                        {voucher.category && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {voucher.category}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(voucher.expenseDate)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 600, color: 'var(--color-deep-navy)', whiteSpace: 'nowrap' }}>
                        {formatCurrency(voucher.amount)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <StatusBadge status={voucher.status.toLowerCase() as VoucherStatusType} />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: hasEmpSig ? 'var(--color-approved-bg)' : 'var(--color-surface-subtle)',
                              color: hasEmpSig ? 'var(--color-approved-text)' : 'var(--color-text-muted)',
                              fontWeight: 500,
                            }}
                            title={hasEmpSig ? 'Employee signature recorded' : 'Missing employee signature'}
                          >
                            Emp {hasEmpSig ? '✓' : '—'}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: hasDirSig ? 'var(--color-approved-bg)' : 'var(--color-surface-subtle)',
                              color: hasDirSig ? 'var(--color-approved-text)' : 'var(--color-text-muted)',
                              fontWeight: 500,
                            }}
                            title={hasDirSig ? 'Director authorization signature recorded' : 'No director signature'}
                          >
                            Dir {hasDirSig ? '✓' : '—'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye size={13} />}
                          onClick={() => navigate(`/accounts/vouchers/${voucher.id}`)}
                        >
                          Audit Record
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageContainer>
  )
}
