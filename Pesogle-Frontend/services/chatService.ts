import type { ApiResponse } from './api';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const mockThreads: ChatThread[] = [
  {
    id: 'c1',
    participantId: '1',
    participantName: 'Dr. Sarah Chen',
    participantAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'I reviewed your research proposal. Let\'s discuss the methodology section.',
    lastMessageTime: '10m ago',
    unreadCount: 2,
  },
  {
    id: 'c2',
    participantId: '2',
    participantName: 'Raj Patel',
    participantAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'The distributed training setup is ready. Can you test the pipeline?',
    lastMessageTime: '1h ago',
    unreadCount: 0,
  },
  {
    id: 'c3',
    participantId: '3',
    participantName: 'Emily Rodriguez',
    participantAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'Pushed the new UI components. Check the PR when you get a chance!',
    lastMessageTime: '3h ago',
    unreadCount: 1,
  },
];

export const mockMessages: ChatMessage[] = [
  { id: 'm1', senderId: '1', text: 'Hi Alex, I saw your project on sentiment analysis.', timestamp: '9:00 AM', read: true },
  { id: 'm2', senderId: 'current', text: 'Yes! I would love your feedback on the approach.', timestamp: '9:05 AM', read: true },
  { id: 'm3', senderId: '1', text: 'The transformer-based approach looks solid. Have you considered using cross-attention mechanisms?', timestamp: '9:10 AM', read: true },
  { id: 'm4', senderId: 'current', text: 'Not yet. Could you point me to some relevant papers?', timestamp: '9:15 AM', read: true },
  { id: 'm5', senderId: '1', text: 'I reviewed your research proposal. Let\'s discuss the methodology section.', timestamp: '9:30 AM', read: false },
  { id: 'm6', senderId: '1', text: 'The literature review is strong but the experimental design needs more detail.', timestamp: '9:31 AM', read: false },
];

export const chatService = {
  getThreads: async (): Promise<ApiResponse<ChatThread[]>> => {
    console.log('[ChatService] Fetching threads');
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockThreads, success: true };
  },

  getMessages: async (threadId: string): Promise<ApiResponse<ChatMessage[]>> => {
    console.log('[ChatService] Fetching messages for thread:', threadId);
    await new Promise(resolve => setTimeout(resolve, 400));
    return { data: mockMessages, success: true };
  },

  sendMessage: async (threadId: string, text: string): Promise<ApiResponse<ChatMessage>> => {
    console.log('[ChatService] Sending message to thread:', threadId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: { id: 'm' + Date.now(), senderId: 'current', text, timestamp: 'Just now', read: false },
      success: true,
    };
  },
};
