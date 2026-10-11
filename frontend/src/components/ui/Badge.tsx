import React from 'react'
import { FileEdit, Clock, CheckCircle2, XCircle } from 'lucide-react'

export type VoucherStatusType = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface StatusBadgeProps {
  status: VoucherStatusType
  label?: string
  className?: string
  showIcon?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  showIcon = true,
}) => {
  const normalizedStatus = status.toLowerCase() as VoucherStatusType

  const getStatusConfig = (s: VoucherStatusType) => {
    switch (s) {
      case 'draft':
        return {
          defaultLabel: 'Draft',
          badgeClass: 'status-badge-draft',
          icon: <FileEdit size={12} strokeWidth={2.2} aria-hidden="true" />,
        }
      case 'submitted':
        return {
          defaultLabel: 'Pending Approval',
          badgeClass: 'status-badge-submitted',
          icon: <Clock size={12} strokeWidth={2.2} aria-hidden="true" />,
        }
      case 'approved':
        return {
          defaultLabel: 'Approved',
          badgeClass: 'status-badge-approved',
          icon: <CheckCircle2 size={12} strokeWidth={2.2} aria-hidden="true" />,
        }
      case 'rejected':
        return {
          defaultLabel: 'Rejected',
          badgeClass: 'status-badge-rejected',
          icon: <XCircle size={12} strokeWidth={2.2} aria-hidden="true" />,
        }
    }
  }

  const config = getStatusConfig(normalizedStatus)
  const displayLabel = label || config.defaultLabel

  return (
    <span className={`status-badge ${config.badgeClass} ${className}`.trim()}>
      {showIcon && config.icon}
      <span>{displayLabel}</span>
    </span>
  )
}
