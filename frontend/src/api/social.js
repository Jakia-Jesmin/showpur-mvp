import { apiRequest } from './api';

export const socialAPI = {
  // Posts
  getPosts: (page = 1) => apiRequest(`/social/posts/?page=${page}`),
  
  createPost: (content, image = null) => apiRequest('/social/posts/', {
    method: 'POST',
    body: JSON.stringify({ content, image }),
  }),
  
  updatePost: (id, content) => apiRequest(`/social/posts/${id}/`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  }),
  
  deletePost: (id) => apiRequest(`/social/posts/${id}/`, {
    method: 'DELETE',
  }),
  
  // Likes
  likePost: (postId) => apiRequest(`/social/posts/${postId}/like/`, {
    method: 'POST',
  }),
  
  unlikePost: (postId) => apiRequest(`/social/posts/${postId}/unlike/`, {
    method: 'POST',
  }),
  
  // Comments
  addComment: (postId, comment) => apiRequest(`/social/posts/${postId}/comments/`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  }),
  
  getComments: (postId) => apiRequest(`/social/posts/${postId}/comments/`),
  
  // Feed
  getFeed: () => apiRequest('/social/feed/'),
};
