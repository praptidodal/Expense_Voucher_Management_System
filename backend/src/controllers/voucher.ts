import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma'
import { generateNextVoucherNumber } from '../utils/voucherNumber'

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/signatures')

// Ensure uploads directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

/**
 * List the current employee's vouchers
 */
export const getMyVouchers = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  try {
    const vouchers = await prisma.voucher.findMany({
      where: {
        employeeId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    res.status(200).json({ vouchers })
  } catch (error) {
    console.error('[Voucher] Error fetching my vouchers:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve vouchers' })
  }
}

/**
 * Get a single voucher by ID (enforces ownership for employees)
 */
export const getVoucherById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  const { id } = req.params

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    if (!voucher) {
      res.status(404).json({ error: 'Not Found', message: 'Voucher not found' })
      return
    }

    // Role-based access control: Employees can only view their own vouchers
    if (req.user.role === 'EMPLOYEE' && voucher.employeeId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to view this voucher' })
      return
    }

    res.status(200).json({ voucher })
  } catch (error) {
    console.error('[Voucher] Error fetching voucher details:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve voucher details' })
  }
}

/**
 * Create a new voucher (defaults to DRAFT, or SUBMITTED if action is submit and valid)
 */
export const createVoucher = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  const {
    voucherDate,
    expenseDate,
    department,
    title,
    category,
    description,
    amount,
    employeeSignaturePath,
    action, // 'draft' | 'submit'
  } = req.body

  const isSubmitAction = action === 'submit'

  // Validation for submission
  if (isSubmitAction) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Expense title is required for submission' })
      return
    }
    if (!department || typeof department !== 'string' || !department.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Department is required for submission' })
      return
    }
    if (!expenseDate) {
      res.status(400).json({ error: 'Bad Request', message: 'Expense date is required for submission' })
      return
    }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Amount must be a positive number greater than zero' })
      return
    }
    if (!employeeSignaturePath || typeof employeeSignaturePath !== 'string' || !employeeSignaturePath.trim()) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Employee signature is mandatory before submitting for approval',
      })
      return
    }
  }

  // Parse fields with safe fallbacks for drafts
  const parsedExpenseDate = expenseDate ? new Date(expenseDate) : new Date()
  if (isNaN(parsedExpenseDate.getTime())) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid expense date provided' })
    return
  }

  const parsedVoucherDate = voucherDate ? new Date(voucherDate) : new Date()
  const rawAmount = parseFloat(amount)
  const safeAmount = isNaN(rawAmount) || rawAmount < 0 ? 0 : rawAmount

  const finalTitle = title && typeof title === 'string' && title.trim() ? title.trim() : 'Untitled Draft'
  const finalDept = department && typeof department === 'string' && department.trim()
    ? department.trim()
    : req.user.department || 'General'

  // Attempt creation with optimistic retry for unique voucherNumber
  let attempts = 0
  const maxAttempts = 5
  let createdVoucher = null

  while (attempts < maxAttempts && !createdVoucher) {
    attempts++
    try {
      const voucherNumber = await generateNextVoucherNumber(prisma)

      createdVoucher = await prisma.voucher.create({
        data: {
          voucherNumber,
          employeeId: req.user.id,
          voucherDate: parsedVoucherDate,
          expenseDate: parsedExpenseDate,
          department: finalDept,
          title: finalTitle,
          category: category && typeof category === 'string' ? category.trim() : null,
          description: description && typeof description === 'string' ? description.trim() : null,
          amount: new Prisma.Decimal(safeAmount),
          employeeSignaturePath: employeeSignaturePath || null,
          status: isSubmitAction ? 'SUBMITTED' : 'DRAFT',
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
      })
    } catch (err: any) {
      // P2002 is Prisma unique constraint violation (concurrency collision on voucherNumber)
      if (err.code === 'P2002' && attempts < maxAttempts) {
        continue
      }
      console.error('[Voucher] Error creating voucher:', err)
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create voucher' })
      return
    }
  }

  res.status(201).json({ voucher: createdVoucher })
}

/**
 * Update an existing DRAFT voucher
 */
export const updateDraftVoucher = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  const { id } = req.params
  const {
    voucherDate,
    expenseDate,
    department,
    title,
    category,
    description,
    amount,
    employeeSignaturePath,
    action, // 'draft' | 'submit'
  } = req.body

  try {
    const existing = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Voucher not found' })
      return
    }

    if (existing.employeeId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only modify your own vouchers' })
      return
    }

    if (existing.status !== 'DRAFT') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Only vouchers in DRAFT status can be edited. Submitted or processed vouchers are locked.',
      })
      return
    }

    const isSubmitAction = action === 'submit'

    const nextTitle = title !== undefined ? String(title).trim() : existing.title
    const nextDept = department !== undefined ? String(department).trim() : existing.department
    const nextExpenseDate = expenseDate ? new Date(expenseDate) : existing.expenseDate
    const nextAmount = amount !== undefined ? parseFloat(amount) : Number(existing.amount)
    const nextSignature = employeeSignaturePath !== undefined ? employeeSignaturePath : existing.employeeSignaturePath

    if (isSubmitAction) {
      if (!nextTitle) {
        res.status(400).json({ error: 'Bad Request', message: 'Expense title is required for submission' })
        return
      }
      if (!nextDept) {
        res.status(400).json({ error: 'Bad Request', message: 'Department is required for submission' })
        return
      }
      if (isNaN(nextExpenseDate.getTime())) {
        res.status(400).json({ error: 'Bad Request', message: 'Valid expense date is required for submission' })
        return
      }
      if (isNaN(nextAmount) || nextAmount <= 0) {
        res.status(400).json({ error: 'Bad Request', message: 'Amount must be greater than zero for submission' })
        return
      }
      if (!nextSignature || typeof nextSignature !== 'string' || !nextSignature.trim()) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Employee signature is mandatory before submitting for approval',
        })
        return
      }
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        title: nextTitle,
        department: nextDept,
        expenseDate: nextExpenseDate,
        voucherDate: voucherDate ? new Date(voucherDate) : existing.voucherDate,
        category: category !== undefined ? (category ? String(category).trim() : null) : existing.category,
        description: description !== undefined ? (description ? String(description).trim() : null) : existing.description,
        amount: !isNaN(nextAmount) ? new Prisma.Decimal(nextAmount) : existing.amount,
        employeeSignaturePath: nextSignature || null,
        status: isSubmitAction ? 'SUBMITTED' : 'DRAFT',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    res.status(200).json({ voucher: updated })
  } catch (error) {
    console.error('[Voucher] Error updating draft voucher:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update voucher' })
  }
}

/**
 * Submit an existing DRAFT voucher
 */
export const submitDraftVoucher = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  const { id } = req.params

  try {
    const existing = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Voucher not found' })
      return
    }

    if (existing.employeeId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only submit your own vouchers' })
      return
    }

    if (existing.status !== 'DRAFT') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Voucher is already submitted or processed.',
      })
      return
    }

    // Verify all submission requirements
    if (!existing.title || !existing.title.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Expense title is required before submission' })
      return
    }
    if (!existing.department || !existing.department.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'Department is required before submission' })
      return
    }
    if (!existing.expenseDate) {
      res.status(400).json({ error: 'Bad Request', message: 'Expense date is required before submission' })
      return
    }
    if (Number(existing.amount) <= 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Amount must be greater than zero before submission' })
      return
    }
    if (!existing.employeeSignaturePath || !existing.employeeSignaturePath.trim()) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Employee signature is mandatory before submitting for approval',
      })
      return
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    res.status(200).json({ voucher: updated })
  } catch (error) {
    console.error('[Voucher] Error submitting voucher:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to submit voucher' })
  }
}

/**
 * Delete a DRAFT voucher
 */
export const deleteDraftVoucher = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  const { id } = req.params

  try {
    const existing = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Voucher not found' })
      return
    }

    if (existing.employeeId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own vouchers' })
      return
    }

    if (existing.status !== 'DRAFT') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Only draft vouchers can be deleted. Submitted or processed vouchers cannot be deleted.',
      })
      return
    }

    await prisma.voucher.delete({
      where: { id },
    })

    res.status(200).json({ message: 'Draft voucher deleted successfully', id })
  } catch (error) {
    console.error('[Voucher] Error deleting draft voucher:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete draft voucher' })
  }
}

/**
 * Upload employee signature image (validates file size <= 2MB, magic bytes PNG/JPEG)
 */
export const uploadSignature = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  const { fileData, fileName } = req.body

  if (!fileData || typeof fileData !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'No file data received. Please provide a valid signature image.',
    })
    return
  }

  try {
    // Extract base64 payload from data URL if present
    let base64Content = fileData
    let mimeType = ''

    if (fileData.startsWith('data:')) {
      const match = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
      if (!match) {
        res.status(400).json({ error: 'Bad Request', message: 'Invalid data URL format for signature' })
        return
      }
      mimeType = match[1].toLowerCase()
      base64Content = match[2]
    }

    const buffer = Buffer.from(base64Content, 'base64')

    // Enforce 2MB size limit
    const MAX_SIZE = 2 * 1024 * 1024 // 2 Megabytes
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'File size exceeds maximum allowed limit of 2MB.',
      })
      return
    }

    // Magic bytes verification
    let extension = ''
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      extension = 'png'
    } else if (
      // JPEG: FF D8 FF
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      extension = 'jpg'
    } else {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid file format. Only authentic PNG and JPG/JPEG images are accepted.',
      })
      return
    }

    // Generate safe, randomized filename
    const safeFilename = `sig_${crypto.randomUUID()}.${extension}`
    const destinationPath = path.join(UPLOAD_DIR, safeFilename)

    await fs.promises.writeFile(destinationPath, buffer)

    const signaturePath = `/api/signatures/${safeFilename}`
    res.status(200).json({
      signaturePath,
      filename: safeFilename,
      size: buffer.length,
    })
  } catch (error) {
    console.error('[Upload] Error uploading signature:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process signature upload' })
  }
}

/**
 * Controlled, authenticated access to stored signature images
 */
export const getSignatureFile = async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params

  // Prevent directory traversal: allow only safe characters
  if (!/^[a-zA-Z0-9_\-]+\.(png|jpe?g)$/i.test(filename)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid signature filename' })
    return
  }

  const filePath = path.join(UPLOAD_DIR, filename)

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Not Found', message: 'Signature file not found' })
    return
  }

  const ext = path.extname(filename).toLowerCase()
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg'

  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'private, max-age=86400')
  fs.createReadStream(filePath).pipe(res)
}

/**
 * List all organization vouchers with search, filter, and sort (for Director & Accounts)
 */
export const getAllVouchers = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  const {
    search,
    status,
    department,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query

  try {
    const whereClause: Prisma.VoucherWhereInput = {}

    // Status filter
    if (status && typeof status === 'string' && status !== 'ALL') {
      const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']
      if (validStatuses.includes(status.toUpperCase())) {
        whereClause.status = status.toUpperCase() as any
      }
    }

    // Department filter
    if (department && typeof department === 'string' && department !== 'ALL') {
      whereClause.department = department.trim()
    }

    // Expense Category filter
    if (category && typeof category === 'string' && category !== 'ALL') {
      whereClause.category = category.trim()
    }

    // Date Range filter (evaluated on expenseDate)
    if (startDate || endDate) {
      whereClause.expenseDate = {}
      if (startDate && typeof startDate === 'string') {
        const start = new Date(startDate)
        if (!isNaN(start.getTime())) {
          whereClause.expenseDate.gte = start
        }
      }
      if (endDate && typeof endDate === 'string') {
        const end = new Date(endDate)
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999)
          whereClause.expenseDate.lte = end
        }
      }
    }

    // Amount Range filter (evaluated on amount)
    if ((minAmount !== undefined && minAmount !== '') || (maxAmount !== undefined && maxAmount !== '')) {
      whereClause.amount = {}
      if (minAmount !== undefined && minAmount !== '') {
        const min = parseFloat(String(minAmount))
        if (!isNaN(min)) {
          whereClause.amount.gte = new Prisma.Decimal(min)
        }
      }
      if (maxAmount !== undefined && maxAmount !== '') {
        const max = parseFloat(String(maxAmount))
        if (!isNaN(max)) {
          whereClause.amount.lte = new Prisma.Decimal(max)
        }
      }
    }

    // Search filter across voucherNumber, title, category, department, employee name, employee email
    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim()
      whereClause.OR = [
        { voucherNumber: { contains: term } },
        { title: { contains: term } },
        { category: { contains: term } },
        { department: { contains: term } },
        { employee: { name: { contains: term } } },
        { employee: { email: { contains: term } } },
      ]
    }

    // Sort validation
    const allowedSortFields = ['expenseDate', 'createdAt', 'amount', 'voucherNumber', 'voucherDate']
    const safeSortBy = allowedSortFields.includes(String(sortBy)) ? String(sortBy) : 'createdAt'
    const safeSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc'

    const vouchers = await prisma.voucher.findMany({
      where: whereClause,
      orderBy: {
        [safeSortBy]: safeSortOrder,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    // Compute organization-wide summary stats for dashboard cards
    const allOrgVouchers = await prisma.voucher.findMany({
      select: {
        status: true,
        amount: true,
        approvalDate: true,
        updatedAt: true,
      },
    })

    const total = allOrgVouchers.length
    const pending = allOrgVouchers.filter((v) => v.status === 'SUBMITTED').length
    const approved = allOrgVouchers.filter((v) => v.status === 'APPROVED').length
    const rejected = allOrgVouchers.filter((v) => v.status === 'REJECTED').length
    const draft = allOrgVouchers.filter((v) => v.status === 'DRAFT').length
    const totalPendingAmount = allOrgVouchers
      .filter((v) => v.status === 'SUBMITTED')
      .reduce((sum, v) => sum + parseFloat(String(v.amount) || '0'), 0)
    const totalApprovedAmount = allOrgVouchers
      .filter((v) => v.status === 'APPROVED')
      .reduce((sum, v) => sum + parseFloat(String(v.amount) || '0'), 0)

    // Today's metrics (midnight start of current local day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const approvedToday = allOrgVouchers.filter(
      (v) => v.status === 'APPROVED' && v.approvalDate && new Date(v.approvalDate) >= today
    ).length

    const rejectedToday = allOrgVouchers.filter(
      (v) => v.status === 'REJECTED' && v.updatedAt && new Date(v.updatedAt) >= today
    ).length

    res.status(200).json({
      vouchers,
      stats: {
        total,
        pending,
        approved,
        rejected,
        draft,
        totalPendingAmount,
        totalApprovedAmount,
        approvedToday,
        rejectedToday,
      },
    })
  } catch (error) {
    console.error('[Voucher] Error fetching all vouchers:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve vouchers' })
  }
}

/**
 * Approve a SUBMITTED voucher with Director signature (Director role only)
 */
export const approveVoucher = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  if (req.user.role !== 'DIRECTOR') {
    res.status(403).json({ error: 'Forbidden', message: 'Only a Director can approve expense vouchers' })
    return
  }

  const { id } = req.params
  const { directorSignaturePath } = req.body

  if (!directorSignaturePath || typeof directorSignaturePath !== 'string' || !directorSignaturePath.trim()) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Director signature image is required before approving an expense voucher',
    })
    return
  }

  try {
    const existing = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Voucher not found' })
      return
    }

    if (existing.status !== 'SUBMITTED') {
      if (existing.status === 'DRAFT') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot approve a draft voucher. The employee must submit the voucher first.',
        })
        return
      }
      if (existing.status === 'APPROVED') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'This voucher has already been approved.',
        })
        return
      }
      if (existing.status === 'REJECTED') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot approve a voucher that has already been rejected.',
        })
        return
      }
    }

    // Atomic update strictly setting approval metadata, preserving all employee-entered fields
    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'APPROVED',
        directorSignaturePath: directorSignaturePath.trim(),
        approvalDate: new Date(),
        rejectionReason: null, // Clear any prior rejection remark if applicable
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    res.status(200).json({
      voucher: updated,
      message: 'Voucher approved successfully and forwarded for reimbursement',
    })
  } catch (error) {
    console.error('[Voucher] Error approving voucher:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to approve voucher' })
  }
}

/**
 * Reject a SUBMITTED voucher with mandatory remarks (Director role only)
 */
export const rejectVoucher = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    return
  }

  if (req.user.role !== 'DIRECTOR') {
    res.status(403).json({ error: 'Forbidden', message: 'Only a Director can reject expense vouchers' })
    return
  }

  const { id } = req.params
  const { rejectionReason } = req.body

  if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Rejection reason is mandatory when rejecting an expense voucher',
    })
    return
  }

  try {
    const existing = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Voucher not found' })
      return
    }

    if (existing.status !== 'SUBMITTED') {
      if (existing.status === 'DRAFT') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot reject a draft voucher. The employee must submit the voucher first.',
        })
        return
      }
      if (existing.status === 'APPROVED') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot reject a voucher that has already been approved.',
        })
        return
      }
      if (existing.status === 'REJECTED') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'This voucher has already been rejected.',
        })
        return
      }
    }

    // Atomic update strictly setting rejection metadata, preserving all employee-entered fields
    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        approvalDate: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    res.status(200).json({
      voucher: updated,
      message: 'Voucher rejected successfully',
    })
  } catch (error) {
    console.error('[Voucher] Error rejecting voucher:', error)
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reject voucher' })
  }
}

