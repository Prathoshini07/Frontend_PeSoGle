import apiClient, { type ApiResponse } from './api';
import type { Post } from '@/mocks/posts';
import { mockPosts } from '@/mocks/posts';

export const postService = {
  getPosts: async (category?: string): Promise<ApiResponse<Post[]>> => {
    console.log('[PostService] Fetching posts, category:', category);
    const params = category && category !== 'All' ? { category } : {};
    const response = await apiClient.get('/post/api/v1/post/', { params });
    return { data: response.data, success: true };
  },

  upvotePost: async (postId: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('[PostService] Upvoting post:', postId);
    // Assuming the endpoint exists or will be added
    const response = await apiClient.post(`/post/api/v1/post/${postId}/upvote`);
    return response.data;
  },
};
