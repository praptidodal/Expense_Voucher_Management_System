import React from 'react'

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div className={`section-header ${className}`.trim()}>
      <div>
        <div className="section-header-title-row">
          <h1 style={{ margin: 0 }}>{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="lead" style={{ margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="section-header-actions">
          {actions}
        </div>
      )}
    </div>
  )
}
