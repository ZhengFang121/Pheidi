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
  UpdatePasswordPayload,
  UpdatePasswordResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
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

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const response = await api.patch<UpdateProfileResponse>('/users/me', payload)

  return response.data
}

export const updatePassword = async (payload: UpdatePasswordPayload) => {
  const response = await api.patch<UpdatePasswordResponse>('/users/me/password', payload)

  return response.data
}