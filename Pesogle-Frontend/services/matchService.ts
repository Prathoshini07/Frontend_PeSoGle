import type { ApiResponse } from './api';
import type { User } from '@/mocks/users';
import { mockUsers } from '@/mocks/users';

export const matchService = {
  getMatches: async (filters?: { domain?: string; year?: string; role?: string }): Promise<ApiResponse<User[]>> => {
    console.log('[MatchService] Fetching matches with filters:', filters);
    await new Promise(resolve => setTimeout(resolve, 800));
    let results = [...mockUsers];
    if (filters?.domain) {
      results = results.filter(u => u.domains.some(d => d.includes(filters.domain!)));
    }
    if (filters?.role) {
      results = results.filter(u => u.role === filters.role);
    }
    return { data: results, success: true };
  },

  connectUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('[MatchService] Connecting with user:', userId);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { message: 'Connection request sent' }, success: true };
  },
};
