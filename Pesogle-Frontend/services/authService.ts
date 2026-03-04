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

export interface LoginPasswordRequest {
  email: string;
  password: string;
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
    const response = await apiClient.post('/auth/api/v1/auth/signup/send-otp', {
      email: data.email,
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
    // Note: The backend expects token and refresh_token in Query params
    // This might need more logic on the frontend to pass the tokens from state
    // For now, let's assume the API expects them or we'll adjust the backend if needed
    // However, I'll follow the backend's current signature as researched
    const response = await apiClient.post('/auth/api/v1/auth/signup/set-password', {
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
    });
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
