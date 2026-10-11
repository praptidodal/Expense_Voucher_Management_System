export type Role = 'EMPLOYEE' | 'DIRECTOR' | 'ACCOUNTS'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  department: string | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface MeResponse {
  user: User
}

export interface ApiError {
  error: string
  message: string
}
