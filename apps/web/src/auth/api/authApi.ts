import { http } from '@/app/api/httpClient'

export interface User {
  id: string
  username: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface LoginPayload {
  login: string
  password: string
}

export interface RegisterPayload {
  username: string
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
