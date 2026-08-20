import api from '@/services/api'
import type {
  CurrentUserResponse,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '@/types/auth'

export const login = async (payload: LoginPayload) => {
  const response = await api.post<LoginResponse>('/users/login', payload)

  return response.data
}

export const register = async (payload: RegisterPayload) => {
  const response = await api.post<RegisterResponse>('/users', payload)

  return response.data
}

export const forgotPassword = async (email: string) => {
  const response = await api.post<ForgotPasswordResponse>('/users/forgot-password', {
    email,
  })

  return response.data
}

export const resetPassword = async (payload: ResetPasswordPayload) => {
  const response = await api.post<ResetPasswordResponse>('/users/reset-password', payload)

  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get<CurrentUserResponse>('/users/me')

  return response.data
}
