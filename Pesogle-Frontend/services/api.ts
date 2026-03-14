import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// For physical devices (Expo Go), localhost refers to the device itself.
// We need to use the computer's local IP instead.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const debuggerHost = Constants.expoConfig?.hostUri || Constants.experienceId;
  const address = debuggerHost?.split(':')[0];

  if (address && !address.includes('localhost') && !address.includes('127.0.0.1')) {
    return `http://${address}:8081`;
  }

  return 'http://localhost:8081';
};

const API_BASE_URL = getBaseUrl();
console.log('[API] Using Base URL:', API_BASE_URL);
const AUTH_STORAGE_KEY = 'pesogle_auth';

// Callback registry to allow AuthContext to trigger logout from here
let onAuthError: () => void = () => { };
export const registerAuthErrorHandler = (handler: () => void) => {
  onAuthError = handler;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // Fallback DEV token for testing the backend bypass
        // This simulates random token just to pass HTTPBearer(auto_error=False) 
        // Backend DEV_MODE handles the actual User ID resolution
        config.headers.Authorization = `Bearer dev_override_token`;
      }
    } catch (e) {
      console.log('[API] Interceptor error fetching token:', e);
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.log('[API] Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.log('[API] Response error:', error?.response?.status, error?.message);
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export default apiClient;
