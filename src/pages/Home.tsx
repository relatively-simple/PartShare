import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../lib/types';
import { POSTS_PER_PAGE, CATEGORIES, SHARE_MODES, SORT_OPTIONS } from '../config';
import { PostCard } from '../components/PostCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Home() {
  const { user, needsOnboarding, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabParam = searchParams.get('tab');
  const tab = tabParam === 'request' ? 'request' : 'offer';
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('cat') || '';
  const locationFilter = searchParams.get('loc') || '';
  const shareModeFilter = searchParams.get('mode') || '';
  const sortFilter = searchParams.get('sort') || 'newest';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false); // don't load initially if landing
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total_given: number }>({ total_given: 0 });

  const fetchStats = async () => {
    const { data } = await supabase.rpc('public_stats');
    if (data) {
      setStats({ total_given: (data as any).done || 0 });
    }
  };

  const fetchLocations = async () => {
    const { data } = await supabase
      .from('posts')
      .select('location')
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString());
    if (data) {
      const locs = [...new Set(data.map(l => l.location))];
      setUniqueLocations(locs.sort());
    }
  };

  const fetchPosts = useCallback(async (pageNum: number, isAppend: boolean = false) => {
    if (!tabParam) return; // Don't fetch if on landing page
    
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*')
      .eq('type', tab)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString());

    if (categoryFilter) query = query.eq('category', categoryFilter);
    if (locationFilter) query = query.eq('location', locationFilter);
    if (shareModeFilter) query = query.contains('share_modes', [shareModeFilter]);

    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length > 0) {
      const orQuery = terms.map(t => `title.ilike.%${t}%,model_number.ilike.%${t}%,details.ilike.%${t}%`).join(',');
      query = query.or(orQuery);
    } else {
      if (tab === 'request' && sortFilter === 'soonest') {
        query = query.order('needed_by', { ascending: true, nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const start = pageNum * POSTS_PER_PAGE;
      const end = start + POSTS_PER_PAGE - 1;
      query = query.range(start, end);
    }

    const { data, error } = await query;
    
    if (data) {
      let finalData = data as Post[];
      
      if (terms.length > 0) {
        finalData.forEach((post: any) => {
          let score = 0;
          const textToSearch = [post.title, post.category, post.model_number, post.details].join(' ').toLowerCase();
          for (const term of terms) {
            if (textToSearch.includes(term)) {
              score++;
            }
          }
          post._score = score;
        });
        
        finalData = finalData.filter((p: any) => p._score > 0);
        finalData.sort((a: any, b: any) => {
          if (b._score !== a._score) return b._score - a._score;
          if (tab === 'request' && sortFilter === 'soonest') {
            const dateA = a.needed_by ? new Date(a.needed_by).getTime() : Infinity;
            const dateB = b.needed_by ? new Date(b.needed_by).getTime() : Infinity;
            return dateA - dateB;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        const start = pageNum * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE;
        const paginatedData = finalData.slice(start, end);
        
        if (isAppend) {
          setPosts(prev => [...prev, ...paginatedData]);
        } else {
          setPosts(paginatedData);
        }
        setHasMore(finalData.length > end);
      } else {
        if (isAppend) {
          setPosts(prev => [...prev, ...finalData]);
        } else {
          setPosts(finalData);
        }
        setHasMore(finalData.length === POSTS_PER_PAGE);
      }
    }
    setLoading(false);
  }, [tabParam, tab, searchQuery, categoryFilter, locationFilter, shareModeFilter, sortFilter]);

  useEffect(() => {
    fetchStats();
    fetchLocations();
  }, []);

  useEffect(() => {
    setPage(0);
    if (!tabParam) return;
    const timeoutId = setTimeout(() => {
      fetchPosts(0, false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchPosts, tabParam]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handleActionClick = (type: 'offer' | 'request') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', type);
    setSearchParams(params);
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  // If there is no tab parameter, we are on the landing page
  if (!tabParam) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full mx-auto flex items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-4xl overflow-hidden rounded-3xl p-8 sm:p-16 text-center shadow-2xl border border-white/20 dark:border-white/5 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-brand-900/40 dark:to-brand-800/20 backdrop-blur-md"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-blob" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 space-y-10">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-amber-900 dark:text-amber-100 tracking-tight leading-tight">
              Share parts. <br className="sm:hidden" /><span className="text-brand-500">Reduce waste.</span> <br className="sm:hidden" />Build together.
            </h1>
            <p className="text-lg sm:text-xl text-amber-800/80 dark:text-amber-200/80 max-w-2xl mx-auto">
              Join the community of students and makers sharing leftover electronic and mechanical parts.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button onClick={() => handleActionClick('offer')} className="btn-primary text-xl px-10 py-4 rounded-2xl shadow-xl shadow-brand-500/20 hover:scale-105 transition-transform">I have parts</button>
              <button onClick={() => handleActionClick('request')} className="btn-secondary text-xl px-10 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform bg-white dark:bg-gray-800">I need parts</button>
            </div>
            {stats.total_given > 0 && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="pt-8">
                <span className="inline-block bg-white/80 dark:bg-black/40 backdrop-blur-md px-6 py-3 rounded-full text-brand-700 dark:text-brand-300 font-semibold text-base shadow-sm border border-white/60 dark:border-white/10">
                  ✨ {stats.total_given} parts given a second life
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full mx-auto space-y-8">

      {/* Modern segmented control for tabs */}
      <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-sm max-w-md mx-auto">
        <button
          className={`relative flex-1 py-2.5 text-center font-semibold text-sm rounded-xl transition-colors z-10 ${tab === 'offer' ? 'text-brand-700 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          onClick={() => updateParam('tab', 'offer')}
        >
          {tab === 'offer' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10" />}
          Available Parts
        </button>
        <button
          className={`relative flex-1 py-2.5 text-center font-semibold text-sm rounded-xl transition-colors z-10 ${tab === 'request' ? 'text-brand-700 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          onClick={() => updateParam('tab', 'request')}
        >
          {tab === 'request' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10" />}
          Wanted Parts
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
          <input
            type="text"
            className="input-field w-full pl-12 py-3.5 text-base"
            placeholder="Search parts, models..."
            value={searchQuery}
            onChange={(e) => updateParam('q', e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 p-2">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mr-1 pl-2">
            <Filter size={16} />
            <span className="text-sm font-medium hidden sm:inline">Filters</span>
          </div>
          
          <select className="input-field py-1.5 px-3 text-sm bg-transparent border-gray-200 dark:border-gray-800 w-auto flex-1 min-w-[140px]" value={categoryFilter} onChange={(e) => updateParam('cat', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(({ value: val, label }) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          
          <select className="input-field py-1.5 px-3 text-sm bg-transparent border-gray-200 dark:border-gray-800 w-auto flex-1 min-w-[140px]" value={locationFilter} onChange={(e) => updateParam('loc', e.target.value)}>
            <option value="">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          
          <select className="input-field py-1.5 px-3 text-sm bg-transparent border-gray-200 dark:border-gray-800 w-auto flex-1 min-w-[140px]" value={shareModeFilter} onChange={(e) => updateParam('mode', e.target.value)}>
            <option value="">Any Share Mode</option>
            {SHARE_MODES.map(({ value: val, label }) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select className="input-field py-1.5 px-3 text-sm bg-transparent border-gray-200 dark:border-gray-800 w-auto flex-1 min-w-[140px]" value={sortFilter} onChange={(e) => updateParam('sort', e.target.value)}>
            <option value="newest">Newest first</option>
            {tab === 'request' && <option value="soonest">Soonest deadline</option>}
          </select>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {posts.map(post => (
            <motion.div 
              key={post.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="h-full flex"
            >
              <div className="w-full flex-1">
                <PostCard post={post} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {!loading && posts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState icon={<Search size={32} />} title="No posts found" description="Try adjusting your filters or search query." />
          </motion.div>
        )}
        
        {loading && <div className="py-8"><LoadingSpinner /></div>}
        
        {!loading && hasMore && (
          <div className="text-center pt-8">
            <button onClick={loadMore} className="btn-secondary px-8 rounded-full">Load more</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
