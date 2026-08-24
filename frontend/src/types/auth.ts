import type { AuthUser } from '@/types/user'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: AuthUser
}

export interface RegisterPayload extends LoginPayload {
  username: string
}

export interface RegisterResponse {
  message: string
  user: AuthUser
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface CurrentUserResponse {
  message: string
  user: AuthUser
}

export interface UpdateProfilePayload {
  username: string
  email: string
}

export type UpdateProfileResponse = CurrentUserResponse

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface UpdatePasswordResponse {
  message: string
}