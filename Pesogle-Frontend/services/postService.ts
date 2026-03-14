import apiClient, { type ApiResponse } from './api';
import type { Post } from '@/mocks/posts';

export interface Comment {
  comment_id: string;
  target_type: string;
  target_id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export interface Answer {
  answer_id: string;
  question_id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  content: string;
  upvote_count: number;
  is_accepted: boolean;
  created_at: string;
}


export interface CreatePostData {
  type: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export const postService = {
  getPosts: async (category?: string, type?: string): Promise<ApiResponse<Post[]>> => {
    console.log('[PostService] Fetching posts, category:', category, 'type:', type);
    const params: Record<string, string> = {};
    if (category && category !== 'All') params.category = category;
    if (type && type !== 'All') params.type = type;

    const response = await apiClient.get('/posts/', { params });

    const mappedPosts: Post[] = response.data.map((raw: any) => ({
      id: raw.post_id || raw._id || Math.random().toString(),
      type: raw.type || 'POST',
      authorId: raw.author_id || 'unknown',
      authorName: raw.author_name || 'Anonymous User',
      authorAvatar: raw.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.author_name || 'User')}&background=random`,
      authorDepartment: raw.author_department || 'General',
      title: raw.title,
      content: raw.content,
      category: raw.category,
      upvotes: raw.upvote_count || 0,
      answers: raw.type === 'QUESTION' ? (raw.answer_count || 0) : (raw.comment_count || 0),
      hasAcceptedAnswer: !!raw.accepted_answer_id,

      createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : 'Just now',
      tags: raw.tags || [],
      media: raw.media || [],
    }));

    return { data: mappedPosts, success: true };
  },

  getPostById: async (postId: string): Promise<ApiResponse<Post>> => {
    console.log('[PostService] Fetching single post:', postId);
    const response = await apiClient.get(`/posts/${postId}`);
    const raw = response.data;

    const post: Post = {
      id: raw.post_id || raw._id || postId,
      type: raw.type || 'POST',
      authorId: raw.author_id || 'unknown',
      authorName: raw.author_name || 'Anonymous User',
      authorAvatar: raw.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.author_name || 'User')}&background=random`,
      authorDepartment: raw.author_department || 'General',
      title: raw.title,
      content: raw.content,
      category: raw.category,
      upvotes: raw.upvote_count || 0,
      answers: raw.type === 'QUESTION' ? (raw.answer_count || 0) : (raw.comment_count || 0),
      hasAcceptedAnswer: !!raw.accepted_answer_id,

      createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : 'Just now',
      tags: raw.tags || [],
      media: raw.media || [],
    };

    return { data: post, success: true };
  },

  createPost: async (postData: CreatePostData): Promise<ApiResponse<Post>> => {
    console.log('[PostService] Creating new post');
    const response = await apiClient.post('/posts/', postData);
    const raw = response.data;

    const post: Post = {
      id: raw.post_id || raw._id,
      type: raw.type || 'POST',
      authorId: raw.author_id || 'unknown',
      authorName: raw.author_name || 'Anonymous User',
      authorAvatar: raw.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.author_name || 'User')}&background=random`,
      authorDepartment: raw.author_department || 'General',
      title: raw.title,
      content: raw.content,
      category: raw.category,
      upvotes: raw.upvote_count || 0,
      answers: raw.type === 'QUESTION' ? (raw.answer_count || 0) : (raw.comment_count || 0),
      hasAcceptedAnswer: !!raw.accepted_answer_id,

      createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : 'Just now',
      tags: raw.tags || [],
      media: raw.media || [],
    };

    return { data: post, success: true };
  },


  uploadMedia: async (postId: string, files: any[]): Promise<ApiResponse<any>> => {
    console.log('[PostService] Uploading media for post:', postId);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        name: file.name || 'upload.jpg',
        type: file.type || 'image/jpeg',
      } as any);
    });

    const response = await apiClient.post(`/posts/${postId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { data: response.data, success: true };
  },

  upvotePost: async (postId: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('[PostService] Upvoting post:', postId);
    const response = await apiClient.post(`/posts/vote`, {
      target_type: 'POST',
      target_id: postId
    });
    return response.data;
  },

  getComments: async (targetType: string, targetId: string): Promise<ApiResponse<Comment[]>> => {
    console.log(`[PostService] Fetching comments for ${targetType}:`, targetId);
    const response = await apiClient.get(`/posts/comments/${targetType}/${targetId}`);
    return { data: response.data, success: true };
  },

  addComment: async (targetType: string, targetId: string, content: string): Promise<ApiResponse<Comment>> => {
    console.log(`[PostService] Adding comment to ${targetType}:`, targetId);
    const response = await apiClient.post(`/posts/comments/${targetType}/${targetId}`, { content });
    return { data: response.data, success: true };
  },

  getAnswers: async (questionId: string): Promise<ApiResponse<Answer[]>> => {
    console.log('[PostService] Fetching answers for question:', questionId);
    const response = await apiClient.get(`/posts/questions/${questionId}/answers`);
    return { data: response.data, success: true };
  },

  addAnswer: async (questionId: string, content: string): Promise<ApiResponse<Answer>> => {
    console.log('[PostService] Adding answer to question:', questionId);
    const response = await apiClient.post(`/posts/questions/${questionId}/answers`, { content });
    return { data: response.data, success: true };
  },

  acceptAnswer: async (answerId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post(`/posts/questions/answers/${answerId}/accept`);
    return response.data;
  },
};
