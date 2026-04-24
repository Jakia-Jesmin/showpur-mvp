import React, { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';

export default function PostCard({ post, onLike, onComment, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    onComment(commentText);
    setCommentText('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-4 flex items-center gap-3">
        {post.author_logo ? (
          <img src={post.author_logo} className="w-10 h-10 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            {post.author_name?.[0]}
          </div>
        )}
        <div>
          <h4 className="font-bold text-gray-900">{post.author_name}</h4>
          <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="px-4 pb-3">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
        {post.image && <img src={post.image} alt="Post content" className="mt-3 rounded-lg w-full object-cover max-h-96" />}
      </div>
      
      <div className="px-4 py-3 border-t border-gray-50 flex items-center gap-6">
        <button onClick={onLike} className={`flex items-center gap-1.5 text-sm font-medium transition ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          {post.likes_count}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-purple-600 transition">
          <MessageCircle className="w-5 h-5" />
          {post.comments_count}
        </button>
      </div>

      {showComments && (
        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold">Post</button>
          </form>
          {post.comments?.map(comment => (
            <div key={comment.id} className="mb-3 last:mb-0">
              <span className="font-bold text-xs text-gray-900">{comment.user_name}</span>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
