import { API_BASE_URL } from '../config/api'
import type { Voucher, CreateVoucherPayload, UpdateVoucherPayload } from '../types/voucher'

async function handleResponse<T>(res: Response): Promise<T> {
  let data: Record<string, unknown> | null
  try {
    data = (await res.json()) as Record<string, unknown>
  } catch {
    throw new Error(`Server returned an unexpected response (Status ${res.status}).`)
  }

  if (!res.ok) {
    const errorMsg =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      `Request failed with status ${res.status}`
    throw new Error(errorMsg)
  }

  return data as T
}

export async function fetchMyVouchers(token: string): Promise<Voucher[]> {
  const res = await fetch(`${API_BASE_URL}/vouchers/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await handleResponse<{ vouchers: Voucher[] }>(res)
  return data.vouchers
}

export async function fetchVoucherById(token: string, id: string): Promise<Voucher> {
  const res = await fetch(`${API_BASE_URL}/vouchers/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await handleResponse<{ voucher: Voucher }>(res)
  return data.voucher
}

export async function createVoucher(
  token: string,
  payload: CreateVoucherPayload
): Promise<Voucher> {
  const res = await fetch(`${API_BASE_URL}/vouchers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await handleResponse<{ voucher: Voucher }>(res)
  return data.voucher
}

export async function updateDraftVoucher(
  token: string,
  id: string,
  payload: UpdateVoucherPayload
): Promise<Voucher> {
  const res = await fetch(`${API_BASE_URL}/vouchers/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await handleResponse<{ voucher: Voucher }>(res)
  return data.voucher
}

export async function deleteDraftVoucher(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/vouchers/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  await handleResponse<{ message: string }>(res)
}

export async function submitDraftVoucher(token: string, id: string): Promise<Voucher> {
  const res = await fetch(`${API_BASE_URL}/vouchers/${id}/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await handleResponse<{ voucher: Voucher }>(res)
  return data.voucher
}

export async function uploadSignatureImage(
  token: string,
  fileData: string,
  fileName: string
): Promise<{ signaturePath: string; filename: string }> {
  const res = await fetch(`${API_BASE_URL}/vouchers/upload-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileData, fileName }),
  })
  return handleResponse<{ signaturePath: string; filename: string }>(res)
}

export async function fetchAllVouchers(
  token: string,
  params?: import('../types/voucher').VoucherQueryParams
): Promise<{ vouchers: Voucher[]; stats: import('../types/voucher').DirectorStats }> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.status && params.status !== 'ALL') query.set('status', params.status)
  if (params?.department && params.department !== 'ALL') query.set('department', params.department)
  if (params?.category && params.category !== 'ALL') query.set('category', params.category)
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  if (params?.minAmount !== undefined && params.minAmount !== '') query.set('minAmount', String(params.minAmount))
  if (params?.maxAmount !== undefined && params.maxAmount !== '') query.set('maxAmount', String(params.maxAmount))
  if (params?.sortBy) query.set('sortBy', params.sortBy)
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder)

  const queryString = query.toString() ? `?${query.toString()}` : ''
  const res = await fetch(`${API_BASE_URL}/vouchers${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<{ vouchers: Voucher[]; stats: import('../types/voucher').DirectorStats }>(res)
}

export async function approveVoucher(
  token: string,
  id: string,
  directorSignaturePath: string
): Promise<Voucher> {
  const res = await fetch(`${API_BASE_URL}/vouchers/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directorSignaturePath }),
  })
  const data = await handleResponse<{ voucher: Voucher; message: string }>(res)
  return data.voucher
}

export async function rejectVoucher(
  token: string,
  id: string,
  rejectionReason: string
): Promise<Voucher> {
  const res = await fetch(`${API_BASE_URL}/vouchers/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rejectionReason }),
  })
  const data = await handleResponse<{ voucher: Voucher; message: string }>(res)
  return data.voucher
}

