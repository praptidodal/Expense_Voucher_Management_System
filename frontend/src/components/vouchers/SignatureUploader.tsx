import React, { useState, useRef } from 'react'
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw, Trash2, FileCheck } from 'lucide-react'
import { Button } from '../ui/Button'
import { uploadSignatureImage } from '../../api/voucherApi'
import { useAuth } from '../../context/useAuth'

interface SignatureUploaderProps {
  currentSignaturePath?: string | null
  onSignatureUploaded: (signaturePath: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

export const SignatureUploader: React.FC<SignatureUploaderProps> = ({
  currentSignaturePath,
  onSignatureUploaded,
  disabled = false,
  required = false,
  error,
}) => {
  const { token } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentSignaturePath || null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)

  const processFile = async (file: File) => {
    setUploadError(null)

    // Client-side file type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setUploadError('Invalid file format. Only PNG and JPG/JPEG image formats are accepted.')
      return
    }

    // Client-side file size validation
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size exceeds the 2MB limit. Please upload a smaller image.')
      return
    }

    if (!token) {
      setUploadError('Authentication session not found.')
      return
    }

    setIsUploading(true)

    // Convert file to Base64 data URL
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string
        setPreviewUrl(dataUrl)

        const result = await uploadSignatureImage(token, dataUrl, file.name)
        onSignatureUploaded(result.signaturePath)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to upload signature. Please try again.'
        setUploadError(msg)
        setPreviewUrl(currentSignaturePath || null)
      } finally {
        setIsUploading(false)
      }
    }
    reader.onerror = () => {
      setUploadError('Failed to read the selected file.')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setUploadError(null)
    onSignatureUploaded('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const effectiveError = error || uploadError

  return (
    <div className="signature-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        style={{ display: 'none' }}
        id="signature-file-input"
      />

      {previewUrl ? (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-navy)' }}>
              <FileCheck size={16} style={{ color: 'var(--color-primary)' }} />
              <span>Signature Captured</span>
            </div>
            {!disabled && (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={13} className={isUploading ? 'spin' : ''} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={13} />}
                  onClick={handleRemove}
                  disabled={isUploading}
                  style={{ color: 'var(--color-danger)' }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--color-border-strong)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '90px',
            }}
          >
            <img
              src={previewUrl}
              alt="Employee signature preview"
              style={{
                maxHeight: '80px',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} style={{ color: 'var(--color-approved-text)' }} />
            <span>Valid PNG/JPEG signature ready for voucher submission</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--color-primary)' : effectiveError ? 'var(--color-danger)' : 'var(--color-border-strong)'}`,
            borderRadius: 'var(--radius-md)',
            backgroundColor: isDragOver ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
            padding: 'var(--space-6) var(--space-4)',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease-in-out',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-2)',
            }}
          >
            <UploadCloud size={20} />
          </div>

          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-deep-navy)', marginBottom: '4px' }}>
            {isUploading ? 'Uploading and validating signature...' : 'Upload Employee Signature Image'}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            Drag and drop your signature image here, or click to browse
          </div>

          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            Accepted: PNG, JPG, JPEG &bull; Max size: 2MB {required && '&bull; Mandatory for submission'}
          </div>
        </div>
      )}

      {effectiveError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: 'var(--space-2)',
            color: 'var(--color-danger)',
            fontSize: '12px',
          }}
        >
          <AlertCircle size={14} />
          <span>{effectiveError}</span>
        </div>
      )}
    </div>
  )
}
