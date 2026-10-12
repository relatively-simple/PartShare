import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, ChevronUp, MapPin, ExternalLink, Package } from 'lucide-react';
import type { GroupedPost } from '../lib/clustering';
import { PostCard } from './PostCard';
import { CategoryChip } from './CategoryChip';
import { CONDITIONS } from '../config';
import { timeAgo } from '../lib/utils';

interface GroupedPostCardProps {
  group: GroupedPost;
}

export function GroupedPostCard({ group }: GroupedPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If there's only 1 post for this part, display the standard card directly
  if (group.posts.length === 1) {
    return <PostCard post={group.posts[0]} />;
  }

  const isOffer = group.type === 'offer';

  return (
    <div className="card group relative h-full flex flex-col border border-brand-500/30 dark:border-brand-500/20 shadow-md hover:shadow-lg transition-all bg-gradient-to-b from-white to-amber-50/20 dark:from-gray-900 dark:to-brand-950/20">
      {/* Top Smart Grouping Banner */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800/40">
          <Users size={13} className="text-brand-500" />
          <span>
            {group.posts.length} {isOffer ? 'available' : 'requests'} from {group.distinctAuthorsCount} {group.distinctAuthorsCount === 1 ? 'maker' : 'makers'}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Total qty: <strong className="text-gray-900 dark:text-gray-100 font-bold">{group.totalQuantity}</strong>
        </span>
      </div>

      {/* Main Title & Badges */}
      <div className="mb-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          {group.canonicalTitle}
        </h3>
        {group.model_number && (
          <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
            {group.model_number}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          isOffer
            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700/50'
            : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700/50'
        }`}>
          {isOffer ? '📦 Available Group' : '🔍 Wanted Group'}
        </span>
        <CategoryChip category={group.category} />
      </div>

      {/* Primary Preview Listing */}
      <div className="bg-white/80 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 mb-3 text-sm">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span className="font-medium text-gray-800 dark:text-gray-200">
            Featured listing by {group.posts[0].author_name || 'Member'}
          </span>
          <span>{timeAgo(group.posts[0].created_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <MapPin size={13} className="text-brand-500 shrink-0" />
          <span className="truncate">{group.posts[0].location}</span>
          {group.posts[0].condition && (
            <span className="ml-auto font-medium text-blue-600 dark:text-blue-400">
              {CONDITIONS.find(c => c.value === group.posts[0].condition)?.label || group.posts[0].condition}
            </span>
          )}
        </div>
      </div>

      {/* Expand / Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-auto py-2 px-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200"
      >
        <span>{isExpanded ? 'Hide listings' : `View all ${group.posts.length} listings`}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded Listings List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-3 space-y-2.5"
          >
            {group.posts.map((post, idx) => (
              <div
                key={post.id}
                className="p-3 rounded-xl bg-gray-50/90 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {post.author_name || `Member #${idx + 1}`}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (qty: {post.quantity})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin size={12} className="text-brand-500 shrink-0" />
                    <span className="truncate">{post.location}</span>
                    {post.condition && (
                      <span className="text-blue-600 dark:text-blue-400">
                        • {CONDITIONS.find(c => c.value === post.condition)?.label}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={`/p/${post.id}`}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 shrink-0 rounded-lg shadow-sm"
                >
                  <span>View</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
