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
    <div className="card group relative h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <Link to={`/p/${post.id}`} className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 transition-colors truncate pr-2 after:absolute after:inset-0">
          {post.title}
        </Link>
        {post.quantity > 1 && (
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold px-2 py-1 rounded">
            ×{post.quantity}
          </span>
        )}
      </div>
      
      {post.model_number && (
        <div className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-2">
          {post.model_number}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-3">
        <CategoryChip category={post.category} />
        
        {post.condition && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
            {CONDITIONS.find(c => c.value === post.condition)?.label || post.condition}
          </span>
        )}
        
        {post.share_modes?.map(mode => (
          <span key={mode} className={`text-xs font-medium px-2 py-1 rounded border ${
            mode === 'give' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50' :
            mode === 'lend' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50' :
            'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50'
          }`}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </span>
        ))}
      </div>
      
      <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          <span className="truncate">{post.location}</span>
        </div>
        
        {post.type === 'request' && post.needed_by && (
          <div className={`flex items-center gap-1 ${isUrgent ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
            <Calendar size={14} />
            <span>Need by {formatDate(post.needed_by)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3 mt-auto relative z-10">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {post.author_name}
        </span>
        
        {showStatus && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            post.status === 'open' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
            post.status === 'done' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
            'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
          }`}>
            {post.status.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
