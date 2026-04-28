import { http } from '@/app/api/httpClient'

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  name: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export const authApi = {
  login: (dto: LoginPayload) =>
    http<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(dto) }),

  register: (dto: RegisterPayload) =>
    http<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(dto) }),

  me: () => http<User>('/api/auth/me'),
}
