import { api } from '@/lib/api'
import type { PublicUser, User } from '@/types'

export interface LoginPayload { username: string; password: string }
export interface RegisterPayload {
  username: string; password: string; nickname: string; biography?: string
}
export interface LoginResponse { access: string; user: User }

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<User>('/auth/register/', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<LoginResponse>('/auth/login/', data).then((r) => r.data),

  logout: () => api.post('/auth/logout/').then((r) => r.data),

  refresh: () => api.post<{ access: string }>('/auth/refresh/', {}).then((r) => r.data),
}

export const usersApi = {
  me: () => api.get<User>('/users/me/').then((r) => r.data),

  updateProfile: (data: { nickname?: string; biography?: string }) =>
    api.patch<User>('/users/me/profile/', data).then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    api.patch('/users/me/password/', { current_password, new_password }).then((r) => r.data),

  getUser: (id: string) =>
    api.get<PublicUser>(`/users/${id}/`).then((r) => r.data),
}
