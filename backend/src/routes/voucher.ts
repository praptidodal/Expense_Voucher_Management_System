import { Router } from 'express'
import { Role } from '@prisma/client'
import { authenticateToken, requireRole } from '../middleware/auth'
import {
  getMyVouchers,
  getVoucherById,
  getAllVouchers,
  createVoucher,
  updateDraftVoucher,
  deleteDraftVoucher,
  submitDraftVoucher,
  approveVoucher,
  rejectVoucher,
  uploadSignature,
  getSignatureFile,
} from '../controllers/voucher'

export const voucherRouter = Router()

// Organization-wide voucher list (Director & Accounts)
voucherRouter.get(
  '/vouchers',
  authenticateToken,
  requireRole(Role.DIRECTOR, Role.ACCOUNTS),
  getAllVouchers
)

// Director Decision Workflow (Director role only)
voucherRouter.post(
  '/vouchers/:id/approve',
  authenticateToken,
  requireRole(Role.DIRECTOR),
  approveVoucher
)
voucherRouter.post(
  '/vouchers/:id/reject',
  authenticateToken,
  requireRole(Role.DIRECTOR),
  rejectVoucher
)

// Employee-scoped voucher management routes
voucherRouter.get('/vouchers/my', authenticateToken, requireRole(Role.EMPLOYEE), getMyVouchers)
voucherRouter.get('/vouchers/:id', authenticateToken, getVoucherById)
voucherRouter.post('/vouchers', authenticateToken, requireRole(Role.EMPLOYEE), createVoucher)
voucherRouter.put('/vouchers/:id', authenticateToken, requireRole(Role.EMPLOYEE), updateDraftVoucher)
voucherRouter.delete('/vouchers/:id', authenticateToken, requireRole(Role.EMPLOYEE), deleteDraftVoucher)
voucherRouter.post('/vouchers/:id/submit', authenticateToken, requireRole(Role.EMPLOYEE), submitDraftVoucher)

// Signature handling
voucherRouter.post(
  '/vouchers/upload-signature',
  authenticateToken,
  requireRole(Role.EMPLOYEE, Role.DIRECTOR),
  uploadSignature
)

// Authenticated retrieval of signature images
voucherRouter.get('/signatures/:filename', authenticateToken, getSignatureFile)
