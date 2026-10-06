import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Package } from 'lucide-react';
import type { Post } from '../lib/types';
import { CategoryChip } from './CategoryChip';
import { timeAgo, daysUntil, formatDate } from '../lib/utils';
import { CONDITIONS } from '../config';

interface PostCardProps {
  post: Post;
  showStatus?: boolean;
}

export function PostCard({ post, showStatus }: PostCardProps) {
  const neededByDays = post.needed_by ? daysUntil(post.needed_by) : null;
  const isUrgent = neededByDays !== null && neededByDays <= 7;
  
  return (
    <div className="card group relative">
      <div className="flex justify-between items-start mb-2">
        <Link to={`/p/${post.id}`} className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 transition-colors truncate pr-2 after:absolute after:inset-0">
          {post.title}
        </Link>
        {post.quantity > 1 && (
          <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-2 py-1 rounded">
            ×{post.quantity}
          </span>
        )}
      </div>
      
      {post.model_number && (
        <div className="font-mono text-sm text-gray-600 mb-2">
          {post.model_number}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-3">
        <CategoryChip category={post.category} />
        
        {post.condition && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {CONDITIONS.find(c => c.value === post.condition)?.label || post.condition}
          </span>
        )}
        
        {post.share_modes?.map(mode => (
          <span key={mode} className={`text-xs font-medium px-2 py-1 rounded border ${
            mode === 'give' ? 'bg-green-50 text-green-700 border-green-200' :
            mode === 'lend' ? 'bg-purple-50 text-purple-700 border-purple-200' :
            'bg-orange-50 text-orange-700 border-orange-200'
          }`}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </span>
        ))}
      </div>
      
      <div className="flex flex-col gap-1 text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          <span className="truncate">{post.location}</span>
        </div>
        
        {post.type === 'request' && post.needed_by && (
          <div className={`flex items-center gap-1 ${isUrgent ? 'text-red-600 font-medium' : ''}`}>
            <Calendar size={14} />
            <span>Need by {formatDate(post.needed_by)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t pt-3 mt-auto">
        <span className="text-sm font-medium text-gray-700">
          {post.author_name}
        </span>
        
        {showStatus && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            post.status === 'open' ? 'bg-green-100 text-green-800' :
            post.status === 'done' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}>
            {post.status.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
