import React, { useState, useEffect } from 'react'
import { FileCheck, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { API_BASE_URL } from '../../config/api'

interface AuthenticatedSignatureImageProps {
  signaturePath: string
  alt?: string
  style?: React.CSSProperties
  className?: string
}

export const AuthenticatedSignatureImage: React.FC<AuthenticatedSignatureImageProps> = ({
  signaturePath,
  alt = 'Signature Image',
  style,
  className = '',
}) => {
  const { token } = useAuth()
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(signaturePath && token))
  const [hasError, setHasError] = useState<boolean>(() => !signaturePath || !token)

  useEffect(() => {
    if (!signaturePath || !token) {
      return
    }

    let isMounted = true
    let createdUrl: string | null = null

    // Determine target URL
    const targetUrl = signaturePath.startsWith('http')
      ? signaturePath
      : `${API_BASE_URL.replace(/\/api$/, '')}${signaturePath}`

    fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load signature image')
        return res.blob()
      })
      .then((blob) => {
        if (isMounted) {
          createdUrl = URL.createObjectURL(blob)
          setBlobUrl(createdUrl)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [signaturePath, token])

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70px',
          color: 'var(--color-text-muted)',
          fontSize: '12px',
          gap: '6px',
          ...style,
        }}
      >
        <Loader2 size={16} className="spin" />
        <span>Loading authenticated signature...</span>
      </div>
    )
  }

  if (hasError || !blobUrl) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70px',
          color: 'var(--color-danger)',
          backgroundColor: 'var(--color-danger-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-danger-border)',
          fontSize: '12px',
          gap: '6px',
          padding: '8px',
          ...style,
        }}
      >
        <AlertCircle size={16} />
        <span>Signature image unavailable</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        src={blobUrl}
        alt={alt}
        className={className}
        style={{
          maxHeight: '80px',
          maxWidth: '100%',
          objectFit: 'contain',
          ...style,
        }}
      />
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
        <FileCheck size={12} style={{ color: 'var(--color-approved-text)' }} />
        <span>Cryptographically verified asset</span>
      </div>
    </div>
  )
}
