import apiClient, { type ApiResponse } from './api';
import type { User } from '@/mocks/users';
import { currentUser } from '@/mocks/users';

export interface ProfileCreateRequest {
  name: string;
  department: string;
  year: string;
  domains: string[];
  skills: string[];
  projects: string[];
  goals: string[];
  bio: string;
}

export const profileService = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    console.log('[ProfileService] Fetching profile');
    const response = await apiClient.get('/profile/me');
    return response.data;
  },

  createProfile: async (data: ProfileCreateRequest): Promise<ApiResponse<User>> => {
    console.log('[ProfileService] Creating profile:', data.name);
    const response = await apiClient.post('/profile/', data);
    return response.data;
  },

  updateProfile: async (data: Partial<ProfileCreateRequest>): Promise<ApiResponse<User>> => {
    console.log('[ProfileService] Updating profile');
    const response = await apiClient.put('/profile/me', data);
    return response.data;
  },
};
