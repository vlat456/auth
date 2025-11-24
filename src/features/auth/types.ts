/**
 * Path: src/features/auth/types.ts
 * Version: 0.2.0
 */

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// --- OpenAPI DTOs ---

export interface RegisterRequestDTO {
  email: string;
  password: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RequestOtpDTO {
  email: string;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
}

export interface CompleteRegistrationDTO {
  actionToken: string;
  newPassword: string;
}

export interface CompletePasswordResetDTO {
  actionToken: string;
  newPassword: string;
}

export interface ChangePasswordRequestDTO {
  email: string;
  newPassword: string;
}

export interface DeleteAccountRequestDTO {
  email: string;
}

export interface RefreshRequestDTO {
  refreshToken: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponseData {
  accessToken: string;
}

export interface ApiSuccessResponse<TData = unknown> {
  status: number;
  message: string;
  data: TData;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  errorId: string;
  message: string;
  path: string;
}

// --- Adapters (Dependency Injection) ---

export interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// --- Repository Interface ---

export interface IAuthRepository {
  login(payload: LoginRequestDTO): Promise<AuthSession>;
  register(payload: RegisterRequestDTO): Promise<void>;
  requestPasswordReset(payload: RequestOtpDTO): Promise<void>;
  verifyOtp(payload: VerifyOtpDTO): Promise<string>;
  completeRegistration(payload: CompleteRegistrationDTO): Promise<void>;
  completePasswordReset(payload: CompletePasswordResetDTO): Promise<void>;
  checkSession(): Promise<AuthSession | null>;
  refresh(refreshToken: string): Promise<AuthSession>;
  logout(): Promise<void>;
}
