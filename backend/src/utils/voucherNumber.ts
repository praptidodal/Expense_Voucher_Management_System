import { PrismaClient } from '@prisma/client'

/**
 * Generates a unique, concurrency-safe voucher number in format EV-YYYYMMDD-XXXX
 * Example: EV-20261011-0001
 */
export async function generateNextVoucherNumber(prisma: PrismaClient): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const datePrefix = `EV-${year}${month}${day}-`

  // Find the highest sequence number created today
  const latestVoucher = await prisma.voucher.findFirst({
    where: {
      voucherNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      voucherNumber: 'desc',
    },
    select: {
      voucherNumber: true,
    },
  })

  let sequence = 1
  if (latestVoucher && latestVoucher.voucherNumber) {
    const parts = latestVoucher.voucherNumber.split('-')
    const lastSeq = parseInt(parts[2], 10)
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1
    }
  }

  const paddedSequence = String(sequence).padStart(4, '0')
  return `${datePrefix}${paddedSequence}`
}
