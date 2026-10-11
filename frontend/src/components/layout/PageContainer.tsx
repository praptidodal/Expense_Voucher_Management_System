import React from 'react'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <main className={`page-container ${className}`.trim()} {...rest}>
      {children}
    </main>
  )
}
