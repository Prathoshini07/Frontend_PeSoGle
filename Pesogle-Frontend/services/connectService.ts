import apiClient, { type ApiResponse } from './api';
import { profileService } from './profileService';
import type { User } from '@/mocks/users';

// --- Interfaces ---

export interface ConnectRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;
  created_at: string;
}

export interface Connection {
  user_id: string;
  connected_user_id: string;
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface SuccessResponse {
  message: string;
}

export interface ConnectionStatus {
  user_id: string;
  status: 'CONNECTED' | 'BLOCKED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NOT_CONNECTED' | 'ERROR';
}

// --- Service Implementation ---

export const connectService = {
  // 1. Connection Requests
  sendRequest: async (receiverId: string): Promise<ApiResponse<ConnectRequest>> => {
    try {
      const response = await apiClient.post<ConnectRequest>(`/connect/request/${receiverId}`);
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        data: {} as any,
        success: false,
        message: error.response?.data?.detail || 'Failed to send invite'
      };
    }
  },

  getIncomingRequests: async (): Promise<ApiResponse<ConnectRequest[]>> => {
    const response = await apiClient.get<ConnectRequest[]>('/connect/requests/incoming');
    return { data: response.data, success: true };
  },

  getOutgoingRequests: async (): Promise<ApiResponse<ConnectRequest[]>> => {
    const response = await apiClient.get<ConnectRequest[]>('/connect/requests/outgoing');
    return { data: response.data, success: true };
  },

  acceptRequest: async (requestId: string): Promise<ApiResponse<SuccessResponse>> => {
    try {
      const response = await apiClient.post<SuccessResponse>(`/connect/request/${requestId}/accept`);
      return { data: response.data, success: true };
    } catch (error: any) {
      return { data: {} as any, success: false, message: error.response?.data?.detail || 'Failed to accept' };
    }
  },

  rejectRequest: async (requestId: string): Promise<ApiResponse<SuccessResponse>> => {
    try {
      const response = await apiClient.post<SuccessResponse>(`/connect/request/${requestId}/reject`);
      return { data: response.data, success: true };
    } catch (error: any) {
      return { data: {} as any, success: false, message: error.response?.data?.detail || 'Failed to reject' };
    }
  },

  // 2. Connections Management
  getConnections: async (): Promise<ApiResponse<Connection[]>> => {
    const response = await apiClient.get<Connection[]>('/connect/connections');
    return { data: response.data, success: true };
  },

  getConnectionIds: async (): Promise<ApiResponse<string[]>> => {
    try {
      const response = await apiClient.get<{ user_id: string; connection_ids: string[] }>('/connect/connections/ids');
      return { data: response.data.connection_ids, success: true };
    } catch (error) {
      return { data: [], success: false, message: 'Failed to fetch connection IDs' };
    }
  },

  removeConnection: async (connectedUserId: string): Promise<ApiResponse<SuccessResponse>> => {
    const response = await apiClient.delete<SuccessResponse>(`/connect/connection/${connectedUserId}`);
    return { data: response.data, success: true };
  },

  // 3. Blocking Logic
  blockUser: async (targetUserId: string): Promise<ApiResponse<SuccessResponse>> => {
    const response = await apiClient.post<SuccessResponse>(`/connect/block/${targetUserId}`);
    return { data: response.data, success: true };
  },

  unblockUser: async (targetUserId: string): Promise<ApiResponse<SuccessResponse>> => {
    const response = await apiClient.delete<SuccessResponse>(`/connect/block/${targetUserId}`);
    return { data: response.data, success: true };
  },

  getBlockedUsers: async (): Promise<ApiResponse<Block[]>> => {
    const response = await apiClient.get<Block[]>('/connect/blocked');
    return { data: response.data, success: true };
  },

  // 4. Connection Status
  getStatus: async (otherUserId: string): Promise<ApiResponse<ConnectionStatus>> => {
    try {
      const response = await apiClient.get<ConnectionStatus>(`/connect/status/${otherUserId}`);
      return { data: response.data, success: true };
    } catch (error) {
      return { data: { status: 'ERROR' } as any, success: false };
    }
  },

  // 5. Rich Data Helpers (Hydrating profiles from IDs)
  getConnectionsWithProfiles: async (): Promise<ApiResponse<User[]>> => {
    try {
      const { data: connections } = await connectService.getConnections();
      const users = await Promise.all(
        connections.map(async (conn) => {
          try {
            const profile = await profileService.getProfileById(conn.connected_user_id);
            return mapProfileToUser(profile, 'Established Connection');
          } catch { return null; }
        })
      );
      return { data: users.filter((u): u is User => u !== null), success: true };
    } catch {
      return { data: [], success: false, message: 'Failed to fetch connections' };
    }
  },

  getIncomingRequestsWithProfiles: async (): Promise<ApiResponse<(ConnectRequest & { sender: User })[]>> => {
    try {
      const { data: requests } = await connectService.getIncomingRequests();
      const richRequests = await Promise.all(
        requests.map(async (req) => {
          try {
            const profile = await profileService.getProfileById(req.sender_id);
            return { ...req, sender: mapProfileToUser(profile, 'Connection Request') };
          } catch { return null; }
        })
      );
      return { data: richRequests.filter((r): r is any => r !== null), success: true };
    } catch {
      return { data: [], success: false };
    }
  },

  getOutgoingRequestsWithProfiles: async (): Promise<ApiResponse<(ConnectRequest & { receiver: User })[]>> => {
    try {
      const { data: requests } = await connectService.getOutgoingRequests();
      const richRequests = await Promise.all(
        requests.map(async (req) => {
          try {
            const profile = await profileService.getProfileById(req.receiver_id);
            return { ...req, receiver: mapProfileToUser(profile, 'Sent Request') };
          } catch { return null; }
        })
      );
      return { data: richRequests.filter((r): r is any => r !== null), success: true };
    } catch {
      return { data: [], success: false };
    }
  },

  getBlockedUsersWithProfiles: async (): Promise<ApiResponse<User[]>> => {
    try {
      const { data: blocks } = await connectService.getBlockedUsers();
      const users = await Promise.all(
        blocks.map(async (block) => {
          try {
            const profile = await profileService.getProfileById(block.blocked_id);
            return mapProfileToUser(profile, 'Blocked');
          } catch { return null; }
        })
      );
      return { data: users.filter((u): u is User => u !== null), success: true };
    } catch {
      return { data: [], success: false, message: 'Failed to fetch blocked users' };
    }
  }
};

// Helper to keep logic DRY across profile fetching methods
const mapProfileToUser = (profile: any, reason: string): User => ({
  id: profile.user_id,
  name: profile.personal_info.full_name,
  email: profile.email,
  department: profile.personal_info.institution,
  year: `${profile.personal_info.academic_batch} Batch`,
  domains: profile.personal_info.branch_or_domain,
  skills: profile.skills_and_interests.skills,
  projects: profile.projects.map((p: any) => p.title),
  goals: profile.skills_and_interests.interests,
  bio: profile.projects[0]?.description || reason,
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personal_info.full_name)}&background=random`,
  matchPercentage: 0,
  matchReason: reason,
  academicScore: 0,
  role: 'student',
});