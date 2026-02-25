import type { ApiResponse } from './api';
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
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: currentUser, success: true };
  },

  createProfile: async (data: ProfileCreateRequest): Promise<ApiResponse<User>> => {
    console.log('[ProfileService] Creating profile:', data.name);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: { ...currentUser, ...data }, success: true };
  },

  updateProfile: async (data: Partial<ProfileCreateRequest>): Promise<ApiResponse<User>> => {
    console.log('[ProfileService] Updating profile');
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { ...currentUser, ...data }, success: true };
  },
};
