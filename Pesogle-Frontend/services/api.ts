import axios from 'axios';

const API_BASE_URL = 'https://api.pesogle.com/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
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
  (error) => {
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
