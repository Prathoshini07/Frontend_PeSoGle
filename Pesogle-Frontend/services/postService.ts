import type { ApiResponse } from './api';
import type { Post } from '@/mocks/posts';
import { mockPosts } from '@/mocks/posts';

export const postService = {
  getPosts: async (category?: string): Promise<ApiResponse<Post[]>> => {
    console.log('[PostService] Fetching posts, category:', category);
    await new Promise(resolve => setTimeout(resolve, 600));
    let results = [...mockPosts];
    if (category && category !== 'All') {
      results = results.filter(p => p.category === category);
    }
    return { data: results, success: true };
  },

  upvotePost: async (postId: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('[PostService] Upvoting post:', postId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { message: 'Upvoted' }, success: true };
  },
};
