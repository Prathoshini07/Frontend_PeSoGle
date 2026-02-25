import apiClient, { type ApiResponse } from './api';

export interface LoginRequest {
  email: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface SetPasswordRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    profileComplete: boolean;
  };
}

export const authService = {
  sendOtp: async (data: LoginRequest): Promise<ApiResponse<{ message: string }>> => {
    console.log('[AuthService] Sending OTP to:', data.email);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: { message: 'OTP sent successfully' }, success: true };
  },

  verifyOtp: async (data: OtpVerifyRequest): Promise<ApiResponse<AuthResponse>> => {
    console.log('[AuthService] Verifying OTP for:', data.email);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: { id: 'current', email: data.email, profileComplete: false },
      },
      success: true,
    };
  },

  setPassword: async (data: SetPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    console.log('[AuthService] Setting password for:', data.email);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { message: 'Password set successfully' }, success: true };
  },

  logout: async (): Promise<void> => {
    console.log('[AuthService] Logging out');
    await new Promise(resolve => setTimeout(resolve, 300));
  },
};
