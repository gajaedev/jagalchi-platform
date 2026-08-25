import { apiClient } from './client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

// === Request Types (aligned with docs/api.md) ===

interface LoginRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  name: string;
  password: string;
  registrationProof: string;
}

interface SendVerificationCodeRequest {
  email: string;
}

interface VerifyCodeRequest {
  email: string;
  code: string;
}

interface ChangePasswordRequest {
  email: string;
  newPassword: string;
  resetProof: string;
}

// === Response Types ===

interface LoginResponse {
  accessToken: string;
}

interface SignUpResponse {
  id: string;
  email: string;
  name: string;
}

interface RefreshTokenResponse {
  accessToken: string;
}

interface VerifyEmailResponse {
  registrationProof: string;
}

interface VerifyPasswordResetResponse {
  resetProof: string;
}

interface OAuthExchangeResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

// === API Functions (endpoints match docs/api.md) ===

/** POST /users/auth/login */
export const login = (data: LoginRequest) =>
  apiClient.post<LoginResponse>('/users/auth/login', data);

/** POST /users */
export const signUp = (data: SignUpRequest) => apiClient.post<SignUpResponse>('/users', data);

/** POST /users/verification — 회원가입 인증코드 전송 */
export const sendVerificationCode = (data: SendVerificationCodeRequest) =>
  apiClient.post<void>('/users/verification', data);

/** PATCH /users/verification — 회원가입 인증코드 확인 */
export const verifyCode = (data: VerifyCodeRequest) =>
  apiClient.patch<VerifyEmailResponse>('/users/verification', data);

/** POST /users/auth/password-reset — 비밀번호 리셋 코드 전송 */
export const sendPasswordResetCode = (data: SendVerificationCodeRequest) =>
  apiClient.post<void>('/users/auth/password-reset', data);

/** PATCH /users/auth/password-reset/verify — 비밀번호 리셋 코드 확인 */
export const verifyPasswordResetCode = (data: VerifyCodeRequest) =>
  apiClient.patch<VerifyPasswordResetResponse>('/users/auth/password-reset/verify', data);

/** PATCH /users/auth/password-reset — 비밀번호 변경 */
export const resetPassword = (data: ChangePasswordRequest) =>
  apiClient.patch<void>('/users/auth/password-reset', data);

/** PATCH /users/auth/refresh — 토큰 갱신 (httpOnly 쿠키 기반) */
export const refreshToken = () => apiClient.patch<RefreshTokenResponse>('/users/auth/refresh');

/** DELETE /users — 계정 삭제 */
export const deleteAccount = () => apiClient.delete<void>('/users');

/** GET /users/auth/login/google — Google OAuth2 로그인 URL (302 리다이렉트) */
export const getGoogleOAuthUrl = (): string => `${BASE_URL}/users/auth/login/google`;

/** GET /users/auth/login/github — GitHub OAuth2 로그인 URL (302 리다이렉트) */
export const getGithubOAuthUrl = (): string => `${BASE_URL}/users/auth/login/github`;

/** GET /users/auth/login/apple — Apple OAuth2 로그인 URL (302 리다이렉트) */
export const getAppleOAuthUrl = (): string => `${BASE_URL}/users/auth/login/apple`;

/** POST /users/auth/oauth/exchange — 일회용 OAuth 완료 코드를 세션으로 교환 */
export const exchangeOAuthCode = (code: string) =>
  apiClient.post<OAuthExchangeResponse>('/users/auth/oauth/exchange', { code });

// === Type Exports ===

export type {
  LoginRequest,
  SignUpRequest,
  SendVerificationCodeRequest,
  VerifyCodeRequest,
  ChangePasswordRequest,
  LoginResponse,
  SignUpResponse,
  RefreshTokenResponse,
  VerifyEmailResponse,
  VerifyPasswordResetResponse,
  OAuthExchangeResponse,
};
