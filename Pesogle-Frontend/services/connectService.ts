import apiClient, { type ApiResponse } from './api';

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
};
