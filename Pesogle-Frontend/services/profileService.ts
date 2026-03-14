import apiClient from './api';

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
}

export interface ProfileResponse extends ProfileCreateRequest {
  user_id: string;
  email: string;
}

export const profileService = {
  getProfile: async (): Promise<ProfileResponse> => {
    console.log('[ProfileService] Fetching profile');
    const response = await apiClient.get<ProfileResponse>('/profile/api/v1/profile/me');
    return response.data;
  },

  createProfile: async (data: ProfileCreateRequest): Promise<ProfileResponse> => {
    console.log('[ProfileService] Creating profile:', data.personal_info.full_name);
    const response = await apiClient.post<ProfileResponse>('/profile/api/v1/profile/', data);
    return response.data;
  },

  updateProfile: async (data: ProfileCreateRequest): Promise<ProfileResponse> => {
    console.log('[ProfileService] Updating profile');
    const response = await apiClient.put<ProfileResponse>('/profile/api/v1/profile/me', data);
    return response.data;
  },
};
