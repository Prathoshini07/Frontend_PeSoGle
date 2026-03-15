import apiClient, { type ApiResponse } from './api';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: string;
  readBy: string[];
}

export interface ChatThread {
  id: string;
  type: 'individual' | 'group';
  participantId: string; // For individual: other user id, For group: group id
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  ownerId?: string;
  participants?: string[];
  admins?: string[];
}

export const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const chatService = {
  getThreads: async (): Promise<ApiResponse<ChatThread[]>> => {
    try {
      console.log('[ChatService] Fetching threads');
      const response = await apiClient.get<any[]>('/chat/api/v1/threads');
      
      const threads: ChatThread[] = response.data.map(t => ({
        id: t.id || t._id,
        type: t.type as 'individual' | 'group',
        participantId: t.type === 'individual' 
          ? t.participants.find((p: string) => p !== 'current') 
          : t.id || t._id,
        participantName: t.name || (t.type === 'individual' ? 'User' : 'Group'), 
        participantAvatar: 'https://ui-avatars.com/api/?name=' + (t.name || (t.type === 'individual' ? 'U' : 'G')),
        lastMessage: t.last_message || 'No messages yet',
        lastMessageTime: formatTime(t.last_message_time),
        unreadCount: 0,
        ownerId: t.owner_id,
        participants: t.participants,
        admins: t.admins,
      }));

      return { data: threads, success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch threads'
      };
    }
  },
  
  getThread: async (chatId: string): Promise<ApiResponse<ChatThread>> => {
    try {
      console.log('[ChatService] Fetching thread:', chatId);
      const response = await apiClient.get<any>(`/chat/api/v1/threads/${chatId}`);
      const t = response.data;
      
      const thread: ChatThread = {
        id: t.id || t._id,
        type: t.type as 'individual' | 'group',
        participantId: t.type === 'individual' 
          ? t.participants.find((p: string) => p !== 'current') 
          : t.id || t._id,
        participantName: t.name || (t.type === 'individual' ? 'User' : 'Group'), 
        participantAvatar: 'https://ui-avatars.com/api/?name=' + (t.name || (t.type === 'individual' ? 'U' : 'G')),
        lastMessage: t.last_message || 'No messages yet',
        lastMessageTime: formatTime(t.last_message_time),
        unreadCount: 0,
        ownerId: t.owner_id,
        participants: t.participants,
        admins: t.admins,
      };

      return { data: thread, success: true };
    } catch (error: any) {
      return {
        data: {} as any,
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch thread'
      };
    }
  },

  getMessages: async (threadId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      console.log(`[ChatService] Fetching messages for thread: ${threadId}, offset: ${offset}`);
      const response = await apiClient.get<any[]>(`/chat/api/v1/threads/${threadId}/messages`, {
        params: { limit, offset }
      });
      
      const messages: ChatMessage[] = response.data.map(m => ({
        id: m.id || m._id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        text: m.text,
        timestamp: formatTime(m.timestamp),
        readBy: m.read_by || [],
      }));

      return { data: messages, success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch messages'
      };
    }
  },

  getOrCreateIndividualThread: async (otherUserId: string): Promise<ApiResponse<ChatThread>> => {
    try {
      console.log('[ChatService] Getting/Creating thread with:', otherUserId);
      const response = await apiClient.post<any>(`/chat/api/v1/threads/individual/${otherUserId}`);
      const t = response.data;
      const thread: ChatThread = {
        id: t.id || t._id,
        type: 'individual',
        participantId: otherUserId,
        participantName: t.name || ('User ' + otherUserId.substring(0, 4)),
        participantAvatar: 'https://ui-avatars.com/api/?name=' + (t.name || 'U'),
        lastMessage: t.last_message || 'No messages yet',
        lastMessageTime: formatTime(t.last_message_time),
        unreadCount: 0,
      };
      return { data: thread, success: true };
    } catch (error: any) {
      return {
        data: {} as any,
        success: false,
        message: error.response?.data?.detail || 'Failed to initiate chat'
      };
    }
  },

  createGroupChat: async (name: string, participants: string[]): Promise<ApiResponse<ChatThread>> => {
    try {
      console.log('[ChatService] Creating group chat:', name);
      const response = await apiClient.post<any>('/chat/api/v1/threads/group', { name, participants });
      const t = response.data;
      const thread: ChatThread = {
        id: t.id || t._id,
        type: 'group',
        participantId: t.id || t._id,
        participantName: t.name,
        participantAvatar: 'https://ui-avatars.com/api/?name=' + t.name,
        lastMessage: t.last_message || 'Group created',
        lastMessageTime: formatTime(t.last_message_time),
        unreadCount: 0,
        ownerId: t.owner_id,
        participants: t.participants,
        admins: t.admins,
      };
      return { data: thread, success: true };
    } catch (error: any) {
      return {
        data: {} as any,
        success: false,
        message: error.response?.data?.detail || 'Failed to create group'
      };
    }
  },

  addGroupMember: async (chatId: string, userId: string): Promise<ApiResponse<boolean>> => {
    try {
      await apiClient.post(`/chat/api/v1/threads/${chatId}/members`, { user_id: userId });
      return { data: true, success: true };
    } catch (error: any) {
      return {
        data: false,
        success: false,
        message: error.response?.data?.detail || 'Failed to add member'
      };
    }
  },

  removeGroupMember: async (chatId: string, userId: string): Promise<ApiResponse<boolean>> => {
    try {
      await apiClient.delete(`/chat/api/v1/threads/${chatId}/members/${userId}`);
      return { data: true, success: true };
    } catch (error: any) {
      return {
        data: false,
        success: false,
        message: error.response?.data?.detail || 'Failed to remove member'
      };
    }
  },

  makeAdmin: async (chatId: string, userId: string): Promise<ApiResponse<boolean>> => {
    try {
      await apiClient.post(`/chat/api/v1/threads/${chatId}/admins`, { user_id: userId });
      return { data: true, success: true };
    } catch (error: any) {
      return {
        data: false,
        success: false,
        message: error.response?.data?.detail || 'Failed to promote member'
      };
    }
  },
  
  leaveGroup: async (chatId: string): Promise<ApiResponse<boolean>> => {
    try {
      await apiClient.post(`/chat/api/v1/threads/${chatId}/leave`);
      return { data: true, success: true };
    } catch (error: any) {
      return {
        data: false,
        success: false,
        message: error.response?.data?.detail || 'Failed to leave group'
      };
    }
  },

  transferOwner: async (chatId: string, userId: string): Promise<ApiResponse<boolean>> => {
    try {
      await apiClient.post(`/chat/api/v1/threads/${chatId}/transfer-owner`, { user_id: userId });
      return { data: true, success: true };
    } catch (error: any) {
      return {
        data: false,
        success: false,
        message: error.response?.data?.detail || 'Failed to transfer ownership'
      };
    }
  },

  sendMessage: async (threadId: string, text: string): Promise<ApiResponse<ChatMessage>> => {
    // Note: Primarily using WebSockets for sending
    console.log('[ChatService] Sending message to thread:', threadId);
    return {
      data: { id: 'm' + Date.now(), senderId: 'current', text, timestamp: formatTime(new Date().toISOString()), readBy: ['current'] },
      success: true,
    };
  },
};
