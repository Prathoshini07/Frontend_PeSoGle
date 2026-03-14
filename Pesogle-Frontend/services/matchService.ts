import apiClient, { type ApiResponse } from './api';
import { profileService } from './profileService';

// We define User interface here since we won't be using mock users directly.
export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  domains: string[];
  skills: string[];
  projects: string[];
  goals: string[];
  bio: string;
  avatar: string;
  matchPercentage: number;
  matchReason: string;
  academicScore: number;
  role: 'student' | 'mentor' | 'researcher';
}

export interface MatchRecommendation {
  user_id: string;
  score: number;
  category: string;
  common_skills?: string[];
  common_domains?: string[];
  batch_gap?: number;
  explanation?: string | {
    matched_intent_keywords?: string[];
    shared_skills?: string[];
  };
}

export const matchService = {
  getMatches: async (filters?: { domain?: string; role?: string }): Promise<ApiResponse<User[]>> => {
    try {
      console.log('[MatchService] Fetching real matches from backend');
      
      // 1. Fetch recommendations from peer-matching service
      const recommendResponse = await apiClient.get<{ matches: MatchRecommendation[] }>('/peer-matching/recommend/');
      const backendMatches = recommendResponse.data?.matches || [];

      // 2. Fetch full profiles for each match
      const users: User[] = await Promise.all(
        backendMatches.map(async (match) => {
          try {
            const profile = await profileService.getProfileById(match.user_id);
            
            let role: 'student' | 'mentor' | 'researcher' = 'student';
            const category = match.category?.toLowerCase() || 'student';
            if (category === 'mentor') role = 'mentor';
            else if (category === 'researcher') role = 'researcher';
            else {
              // Fallback to degree/experience if category is generic
              const degree = profile.personal_info.degree || '';
              if (degree.includes('PhD')) {
                role = 'researcher';
              } else if (degree.includes('Faculty') || degree.includes('Alumni') || profile.experience?.some(e => e.role.toLowerCase().includes('senior'))) {
                role = 'mentor';
              }
            }

            let matchReason = '';
            if (typeof match.explanation === 'string') {
              matchReason = match.explanation;
            } else if (match.common_skills && match.common_skills.length > 0) {
              matchReason = `Strong overlap in ${match.common_skills.slice(0, 2).join(', ')}`;
            } else {
              matchReason = 'Potential research match based on your interests';
            }

            return {
              id: profile.user_id,
              name: profile.personal_info.full_name,
              email: profile.email || '',
              department: profile.personal_info.institution || profile.personal_info.degree || 'Department',
              year: `${profile.personal_info.academic_batch} Batch`,
              domains: profile.personal_info.branch_or_domain || [],
              skills: profile.skills_and_interests?.skills || [],
              projects: profile.projects?.map((p: any) => p.title) || [],
              goals: profile.skills_and_interests?.interests || [],
              bio: profile.projects[0]?.description || profile.experience?.[0]?.role || 'Passion for learning.',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personal_info.full_name)}&background=random`,
              matchPercentage: Math.round((match.score || 0) * 100),
              matchReason: matchReason || 'Strong overall profile match.',
              academicScore: 80,
              role,
            };
          } catch (err) {
            console.error(`[MatchService] Failed to fetch profile for user ${match.user_id}:`, err);
            return null;
          }
        })
      ).then(results => results.filter((u): u is User => u !== null));

      // 3. Apply Local Filters if any
      let filteredResults = users;
      if (filters?.domain && filters.domain !== 'All') {
        const domainSearch = filters.domain.toLowerCase();
        filteredResults = filteredResults.filter(u => u.domains.some(d => d.toLowerCase().includes(domainSearch)));
      }
      if (filters?.role && filters.role !== 'All') {
        const roleSearch = filters.role.toLowerCase();
        filteredResults = filteredResults.filter(u => u.role === roleSearch);
      }

      return { data: filteredResults, success: true };
    } catch (error) {
      console.error('[MatchService] Error fetching matches:', error);
      return { data: [], success: false, message: 'Failed to fetch matches' };
    }
  },

  connectUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('[MatchService] Connecting with user:', userId);
    try {
      const response = await apiClient.post(`/connect/request/${userId}`);
      return { data: { message: 'Connection request sent' }, success: true };
    } catch (error: any) {
      console.error('[MatchService] Error connecting user:', error);
      if (error?.response?.status === 409) {
        return { data: { message: 'A connection request already exists, or you are already connected.' }, success: false };
      }
      return { data: { message: 'Failed to send request' }, success: false };
    }
  },

  getPerfectMatches: async (purpose: string): Promise<ApiResponse<User[]>> => {
    try {
      console.log('[MatchService] Fetching perfect matches for purpose:', purpose);
      
      const recommendResponse = await apiClient.post<{ matches: MatchRecommendation[] }>('/peer-matching/perfect-match/', { intent: purpose });
      const matches = recommendResponse.data?.matches || [];

      const userPromises = matches.map(async (match): Promise<User | null> => {
        try {
          const profile = await profileService.getProfileById(match.user_id);
          
          let role: 'student' | 'mentor' | 'researcher' = 'student';
          const category = match.category?.toLowerCase() || 'student';
          if (category === 'mentor') role = 'mentor';
          else if (category === 'researcher') role = 'researcher';

          let matchReason = 'Perfect match for your current goal.';
          
          if (match.explanation) {
            if (typeof match.explanation === 'string') {
              matchReason = match.explanation;
            } else {
              const exp = match.explanation as any;
              const reasons: string[] = [];
              if (exp.matched_intent_keywords && exp.matched_intent_keywords.length > 0) {
                reasons.push(`Matched goals: ${exp.matched_intent_keywords.join(', ')}`);
              }
              if (exp.shared_skills && exp.shared_skills.length > 0) {
                reasons.push(`Shared skills: ${exp.shared_skills.slice(0, 2).join(', ')}`);
              }
              if (reasons.length > 0) {
                matchReason = reasons.join('. ') + '.';
              }
            }
          }

          return {
            id: match.user_id,
            name: profile.personal_info.full_name,
            email: profile.email || '',
            department: profile.personal_info.institution || profile.personal_info.degree || 'Department',
            year: `Batch ${profile.personal_info.academic_batch}`,
            domains: profile.personal_info.branch_or_domain || [],
            skills: profile.skills_and_interests?.skills || [],
            projects: profile.projects?.map((p: any) => p.title) || [],
            goals: profile.skills_and_interests?.interests || [],
            bio: profile.projects[0]?.description || profile.experience?.[0]?.role || 'Passion for learning.',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personal_info.full_name)}&background=random`,
            matchPercentage: Math.round((match.score || 0) * 100),
            matchReason: matchReason.trim(),
            academicScore: 80,
            role,
          };
        } catch (e) {
          console.error(`[MatchService] Failed to load profile for perfect match ${match.user_id}:`, e);
          return null;
        }
      });

      const results = (await Promise.all(userPromises)).filter((u): u is User => u !== null);
      if (results.length === 0) {
         return { data: [], success: true, message: 'No perfect matches found. Try adjusting your purpose.' };
      }
      return { data: results, success: true };
    } catch (error) {
      console.error('[MatchService] Error getting perfect matches:', error);
      return { data: [], success: false, message: 'Failed to fetch perfect matches' };
    }
  },
};
