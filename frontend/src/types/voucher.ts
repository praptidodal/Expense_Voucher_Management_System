export type VoucherStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface VoucherEmployee {
  id: string
  name: string
  email: string
  department?: string | null
}

export interface Voucher {
  id: string
  voucherNumber: string
  employeeId: string
  employee?: VoucherEmployee
  voucherDate: string
  expenseDate: string
  department: string
  title: string
  category?: string | null
  description?: string | null
  amount: number | string
  employeeSignaturePath?: string | null
  status: VoucherStatus
  directorSignaturePath?: string | null
  approvalDate?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVoucherPayload {
  voucherDate?: string
  expenseDate?: string
  department?: string
  title?: string
  category?: string
  description?: string
  amount?: number | string
  employeeSignaturePath?: string | null
  action?: 'draft' | 'submit'
}

export interface UpdateVoucherPayload {
  voucherDate?: string
  expenseDate?: string
  department?: string
  title?: string
  category?: string
  description?: string
  amount?: number | string
  employeeSignaturePath?: string | null
  action?: 'draft' | 'submit'
}

export interface DirectorStats {
  total: number
  pending: number
  approved: number
  rejected: number
  draft: number
  totalPendingAmount: number
  totalApprovedAmount: number
  approvedToday?: number
  rejectedToday?: number
}

export interface VoucherQueryParams {
  search?: string
  status?: string
  department?: string
  category?: string
  startDate?: string
  endDate?: string
  minAmount?: number | string
  maxAmount?: number | string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

