import apiClient, { type ApiResponse } from './api';

export interface ConnectionRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
}

export interface Connection {
  user_id: string;
  connected_user_id: string;
  created_at: string;
}

export const connectService = {
  getIncomingRequests: async (): Promise<ApiResponse<ConnectionRequest[]>> => {
    const response = await apiClient.get<ConnectionRequest[]>('/connect/requests/incoming');
    return { data: response.data, success: true };
  },

  getOutgoingRequests: async (): Promise<ApiResponse<ConnectionRequest[]>> => {
    const response = await apiClient.get<ConnectionRequest[]>('/connect/requests/outgoing');
    return { data: response.data, success: true };
  },

  sendRequest: async (receiverId: string): Promise<ApiResponse<ConnectionRequest>> => {
    try {
      const response = await apiClient.post<ConnectionRequest>(`/connect/request/${receiverId}`);
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        data: {} as any,
        success: false,
        message: error.response?.data?.detail || 'Failed to send invite'
      };
    }
  },

  acceptRequest: async (requestId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post<{ message: string }>(`/connect/request/${requestId}/accept`);
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        data: {} as any,
        success: false,
        message: error.response?.data?.detail || 'Failed to accept request'
      };
    }
  },

  rejectRequest: async (requestId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post<{ message: string }>(`/connect/request/${requestId}/reject`);
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        data: {} as any,
        success: false,
        message: error.response?.data?.detail || 'Failed to reject request'
      };
    }
  },

  getConnections: async (): Promise<ApiResponse<Connection[]>> => {
    try {
      const response = await apiClient.get<Connection[]>('/connect/connections');
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: 'Failed to fetch connections'
      };
    }
  },

  getStatus: async (otherUserId: string): Promise<ApiResponse<{ status: string }>> => {
    try {
      const response = await apiClient.get<{ status: string }>(`/connect/status/${otherUserId}`);
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        data: { status: 'ERROR' },
        success: false,
        message: 'Failed to fetch connection status'
      };
    }
  },

  getConnectionIds: async (): Promise<ApiResponse<string[]>> => {
    try {
      const response = await apiClient.get<any>('/connect/connections/ids');
      // The backend returns { "user_id": "...", "connection_ids": [...] }
      return { data: response.data.connection_ids, success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: 'Failed to fetch connection IDs'
      };
    }
  },
};
