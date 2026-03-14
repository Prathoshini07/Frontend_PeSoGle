import apiClient, { type ApiResponse } from './api';
import { profileService } from './profileService';
import type { User } from '@/mocks/users';

export interface ConnectRequest {
    request_id: string;
    sender_id: string;
    receiver_id: string;
    status: string;
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
    status: 'CONNECTED' | 'BLOCKED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NOT_CONNECTED';
}

export const connectService = {
    // Requests
    sendRequest: async (receiverId: string): Promise<ApiResponse<ConnectRequest>> => {
        const response = await apiClient.post(`/connect/request/${receiverId}`);
        return { data: response.data, success: true };
    },

    getIncomingRequests: async (): Promise<ApiResponse<ConnectRequest[]>> => {
        const response = await apiClient.get('/connect/requests/incoming');
        return { data: response.data, success: true };
    },

    getOutgoingRequests: async (): Promise<ApiResponse<ConnectRequest[]>> => {
        const response = await apiClient.get('/connect/requests/outgoing');
        return { data: response.data, success: true };
    },

    acceptRequest: async (requestId: string): Promise<ApiResponse<SuccessResponse>> => {
        const response = await apiClient.post(`/connect/request/${requestId}/accept`);
        return { data: response.data, success: true };
    },

    rejectRequest: async (requestId: string): Promise<ApiResponse<SuccessResponse>> => {
        const response = await apiClient.post(`/connect/request/${requestId}/reject`);
        return { data: response.data, success: true };
    },

    // Connections
    getConnections: async (): Promise<ApiResponse<Connection[]>> => {
        const response = await apiClient.get('/connect/connections');
        return { data: response.data, success: true };
    },

    getConnectionIds: async (): Promise<ApiResponse<{ user_id: string; connection_ids: string[] }>> => {
        const response = await apiClient.get('/connect/connections/ids');
        return { data: response.data, success: true };
    },

    checkConnected: async (otherUserId: string): Promise<ApiResponse<{ user_id: string; other_user_id: string; is_connected: boolean }>> => {
        const response = await apiClient.get(`/connect/connections/check/${otherUserId}`);
        return { data: response.data, success: true };
    },

    removeConnection: async (connectedUserId: string): Promise<ApiResponse<SuccessResponse>> => {
        const response = await apiClient.delete(`/connect/connection/${connectedUserId}`);
        return { data: response.data, success: true };
    },

    // Blocks
    blockUser: async (targetUserId: string): Promise<ApiResponse<SuccessResponse>> => {
        const response = await apiClient.post(`/connect/block/${targetUserId}`);
        return { data: response.data, success: true };
    },

    unblockUser: async (targetUserId: string): Promise<ApiResponse<SuccessResponse>> => {
        const response = await apiClient.delete(`/connect/block/${targetUserId}`);
        return { data: response.data, success: true };
    },

    getBlockedUsers: async (): Promise<ApiResponse<Block[]>> => {
        const response = await apiClient.get('/connect/blocked');
        return { data: response.data, success: true };
    },

    // Status
    getStatus: async (otherUserId: string): Promise<ApiResponse<ConnectionStatus>> => {
        const response = await apiClient.get(`/connect/status/${otherUserId}`);
        return { data: response.data, success: true };
    },

    // Rich Data (with Profiles)
    getConnectionsWithProfiles: async (): Promise<ApiResponse<User[]>> => {
        try {
            const response = await connectService.getConnections();
            const connections = response.data;

            const users = await Promise.all(
                connections.map(async (conn) => {
                    try {
                        const profile = await profileService.getProfileById(conn.connected_user_id);
                        return {
                            id: profile.user_id,
                            name: profile.personal_info.full_name,
                            email: profile.email,
                            department: profile.personal_info.institution,
                            year: `${profile.personal_info.academic_batch} Batch`,
                            domains: profile.personal_info.branch_or_domain,
                            skills: profile.skills_and_interests.skills,
                            projects: profile.projects.map((p: any) => p.title),
                            goals: profile.skills_and_interests.interests,
                            bio: profile.projects[0]?.description || 'Established connection',
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personal_info.full_name)}&background=random`,
                            matchPercentage: 0,
                            matchReason: 'Established Connection',
                            academicScore: 0,
                            role: 'student', // Default or fetch if needed
                        } as User;
                    } catch (e) {
                        return null;
                    }
                })
            );

            return { data: users.filter((u): u is User => u !== null), success: true };
        } catch (error) {
            return { data: [], success: false, message: 'Failed to fetch connections' };
        }
    },

    getIncomingRequestsWithProfiles: async (): Promise<ApiResponse<(ConnectRequest & { sender: User })[]>> => {
        try {
            const response = await connectService.getIncomingRequests();
            const requests = response.data;

            const richRequests = await Promise.all(
                requests.map(async (req) => {
                    try {
                        const profile = await profileService.getProfileById(req.sender_id);
                        const sender: User = {
                            id: profile.user_id,
                            name: profile.personal_info.full_name,
                            email: profile.email,
                            department: profile.personal_info.institution,
                            year: `${profile.personal_info.academic_batch} Batch`,
                            domains: profile.personal_info.branch_or_domain,
                            skills: profile.skills_and_interests.skills,
                            projects: profile.projects.map((p: any) => p.title),
                            goals: profile.skills_and_interests.interests,
                            bio: profile.projects[0]?.description || 'Connection Request',
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personal_info.full_name)}&background=random`,
                            matchPercentage: 0,
                            matchReason: 'Connection Request',
                            academicScore: 0,
                            role: 'student',
                        };
                        return { ...req, sender };
                    } catch (e) {
                        return null;
                    }
                })
            );

            return { data: richRequests.filter((r): r is (ConnectRequest & { sender: User }) => r !== null), success: true };
        } catch (error) {
            return { data: [], success: false, message: 'Failed to fetch requests' };
        }
    },

    getOutgoingRequestsWithProfiles: async (): Promise<ApiResponse<(ConnectRequest & { receiver: User })[]>> => {
        try {
            const response = await connectService.getOutgoingRequests();
            const requests = response.data;

            const richRequests = await Promise.all(
                requests.map(async (req) => {
                    try {
                        const profile = await profileService.getProfileById(req.receiver_id);
                        const receiver: User = {
                            id: profile.user_id,
                            name: profile.personal_info.full_name,
                            email: profile.email,
                            department: profile.personal_info.institution,
                            year: `${profile.personal_info.academic_batch} Batch`,
                            domains: profile.personal_info.branch_or_domain,
                            skills: profile.skills_and_interests.skills,
                            projects: profile.projects.map((p: any) => p.title),
                            goals: profile.skills_and_interests.interests,
                            bio: profile.projects[0]?.description || 'Outgoing Request',
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personal_info.full_name)}&background=random`,
                            matchPercentage: 0,
                            matchReason: 'Outgoing Request',
                            academicScore: 0,
                            role: 'student',
                        };
                        return { ...req, receiver };
                    } catch (e) {
                        return null;
                    }
                })
            );

            return { data: richRequests.filter((r): r is (ConnectRequest & { receiver: User }) => r !== null), success: true };
        } catch (error) {
            return { data: [], success: false, message: 'Failed to fetch outgoing requests' };
        }
    },

    getBlockedUsersWithProfiles: async (): Promise<ApiResponse<User[]>> => {
        try {
            const response = await connectService.getBlockedUsers();
            const blocks = response.data;

            const users = await Promise.all(
                blocks.map(async (block) => {
                    try {
                        const profile = await profileService.getProfileById(block.blocked_id);
                        return {
                            id: profile.user_id,
                            name: profile.personal_info.full_name,
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personal_info.full_name)}&background=random`,
                            bio: 'Blocked connection',
                            matchPercentage: 0,
                        } as User;
                    } catch (e) {
                        return null;
                    }
                })
            );

            return { data: users.filter((u): u is User => u !== null), success: true };
        } catch (error) {
            return { data: [], success: false, message: 'Failed to fetch blocked users' };
        }
    },
};

