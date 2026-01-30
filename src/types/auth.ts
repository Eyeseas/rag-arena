export interface User {
  name: string
  email: string
  role: string
}

export interface LoginSuccessResponse {
  success: true
  user: User
}

export interface LoginFailureResponse {
  success: false
  redirectUrl: string
}

export type LoginResponse = LoginSuccessResponse | LoginFailureResponse
