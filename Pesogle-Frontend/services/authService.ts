import apiClient, { type ApiResponse } from './api';

export interface LoginRequest {
  email: string;
  flow_type?: 'signup' | 'reset';
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface SetPasswordRequest {
  email: string;
  password: string;
  confirm_password: string;
  token: string;
  refresh_token: string;
}

export interface LoginPasswordRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    profileComplete: boolean;
  };
}

export const authService = {
  sendOtp: async (data: LoginRequest): Promise<ApiResponse<{ message: string }>> => {
    console.log('[AuthService] Sending OTP to:', data.email, 'Flow:', data.flow_type || 'signup');
    const response = await apiClient.post('/auth/api/v1/auth/signup/send-otp', {
      email: data.email,
      flow_type: data.flow_type || 'signup',
    });
    return response.data;
  },

  verifyOtp: async (data: OtpVerifyRequest): Promise<ApiResponse<AuthResponse>> => {
    console.log('[AuthService] Verifying OTP for:', data.email);
    const response = await apiClient.post('/auth/api/v1/auth/signup/verify-otp', {
      email: data.email,
      otp: data.otp,
    });

    // Map the backend response to the frontend AuthResponse structure
    // Backend returns: { message, access_token, refresh_token }
    // Frontend expects: { token, user: { id, email, profileComplete } }
    return {
      data: {
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
        user: {
          id: 'temp-id', // We'll get real ID from profile or decode token if needed
          email: data.email,
          profileComplete: false
        },
      },
      success: true,
    };
  },

  setPassword: async (data: SetPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    console.log('[AuthService] Setting password for:', data.email);
    const { token, refresh_token, ...payload } = data;
    const response = await apiClient.post(
      `/auth/api/v1/auth/signup/set-password?token=${token}&refresh_token=${refresh_token}`,
      payload
    );
    return response.data;
  },

  login: async (data: LoginPasswordRequest): Promise<ApiResponse<AuthResponse>> => {
    console.log('[AuthService] Logging in with email:', data.email);
    const response = await apiClient.post('/auth/api/v1/auth/login', {
      email: data.email,
      password: data.password,
    });

    // Backend returns: { access_token, token_type }
    return {
      data: {
        token: response.data.access_token,
        user: {
          id: 'temp-id',
          email: data.email,
          profileComplete: true // Assuming login means profile is complete for now
        },
      },
      success: true,
    };
  },

  logout: async (): Promise<void> => {
    console.log('[AuthService] Logging out');
    try {
      await apiClient.post('/auth/api/v1/auth/logout');
    } catch (error) {
      console.log('[AuthService] Logout error (probably fine):', error);
    }
  },
};
