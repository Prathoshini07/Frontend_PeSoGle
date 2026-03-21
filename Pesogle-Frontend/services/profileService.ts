import apiClient, { type ApiResponse } from './api';

export type Degree = 'B.Tech' | 'M.Sc' | 'M.Tech' | 'PhD';

export interface PersonalInfo {
  full_name: string;
  roll_number?: string;
  institution: string;
  degree: Degree;
  branch_or_domain: string[];
  academic_batch: number;
}

export interface SkillsAndInterests {
  skills: string[];
  interests: string[];
}

export interface Project {
  title: string;
  description?: string | null;
  tech_stack: string[];
  role: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
}

export interface ProfileCreateRequest {
  personal_info: PersonalInfo;
  skills_and_interests: SkillsAndInterests;
  projects: Project[];
  experience: Experience[];
  goals?: string[];
  bio?: string | null;
}

export interface ProfileResponse extends ProfileCreateRequest {
  user_id: string;
  email: string;
}

export const profileService = {
  createProfile: async (data: ProfileCreateRequest): Promise<void> => {
    console.log('[ProfileService] Creating profile');
    await apiClient.post('/profile/api/v1/profile/', data);
  },

  updateProfile: async (data: ProfileCreateRequest): Promise<void> => {
    console.log('[ProfileService] Updating profile');
    await apiClient.put('/profile/api/v1/profile/me', data);
  },

  getProfile: async (): Promise<ProfileResponse> => {
    console.log('[ProfileService] Fetching profile');
    const response = await apiClient.get<ProfileResponse>('/profile/api/v1/profile/me');
    return response.data;
  },

  getProfileById: async (userId: string): Promise<ProfileResponse> => {
    console.log('[ProfileService] Fetching profile by ID:', userId);
    const response = await apiClient.get<ProfileResponse>(`/profile/api/v1/profile/${userId}`);
    return response.data;
  },


  searchProfiles: async (query: string): Promise<ProfileResponse[]> => {
    console.log('[ProfileService] Searching profiles:', query);
    const response = await apiClient.get<ProfileResponse[]>(`/profile/api/v1/profile/search/?q=${query}`);
    return response.data;
  },

  getProfilesBulk: async (userIds: string[]): Promise<Record<string, ProfileResponse>> => {
    console.log('[ProfileService] Fetching profiles bulk:', userIds.length);
    const response = await apiClient.post<Record<string, ProfileResponse>>('/profile/api/v1/profile/bulk', { user_ids: userIds });
    return response.data;
  },
}
