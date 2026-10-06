import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Share2, AlertTriangle, MapPin, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CategoryChip } from '../components/CategoryChip';
import { PostCard } from '../components/PostCard';
import type { Post } from '../lib/types';
import { APP_NAME, CONDITIONS } from '../config';
import { timeAgo, formatDate } from '../lib/utils';
import { reportSchema } from '../lib/schemas';

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, needsOnboarding, signIn } = useAuth();
  const { addToast } = useToast();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [matches, setMatches] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPostAndMatches = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error || !data) {
        addToast('Post not found', 'error');
        navigate('/');
      } else {
        const p = data as Post;
        setPost(p);
        if (p.status === 'open' && new Date(p.expires_at).getTime() > Date.now()) {
          const { data: mData } = await supabase.rpc('match_posts', {
            p_for_type: p.type,
            p_title: p.title,
            p_model: p.model_number || null,
            p_category: p.category,
            p_exclude_id: p.id
          });
          if (mData) setMatches(mData as Post[]);
        }
      }
      setLoading(false);
    };
    
    fetchPostAndMatches();
  }, [id, navigate, addToast]);

  const handleContact = async () => {
    if (!user) return signIn();
    if (needsOnboarding) return navigate('/onboarding');
    
    setContactLoading(true);
    const { data, error } = await supabase.rpc('reveal_contact', { p_post_id: post!.id });
    setContactLoading(false);
    
    if (error || !data) {
      addToast(error?.message || 'Could not reveal contact', 'error');
      return;
    }
    
    const message = `Hi ${data.name}, I found your ${post!.type === 'offer' ? 'offer' : 'request'} for '${post!.title}'${post!.model_number ? ` (${post!.model_number})` : ''} on ${APP_NAME}. Is this still available?`;
    window.open(`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = () => {
    const shareText = `Check out this ${post!.type === 'offer' ? 'offer' : 'request'} for '${post!.title}' on ${APP_NAME}: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleReport = async () => {
    try {
      reportSchema.parse({ reason: reportReason });
      await supabase.rpc('report_post', { p_post_id: post!.id, p_reason: reportReason });
      addToast('Post reported. Thank you.', 'success');
      setShowReport(false);
      setReportReason('');
    } catch (err: any) {
      addToast(err.issues?.[0]?.message || 'Invalid reason', 'error');
    }
  };

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;
  if (!post) return null;

  const isExpired = new Date(post.expires_at).getTime() < Date.now();
  const isAvailable = post.status === 'open' && !isExpired;
  const isOwner = user?.id === post.user_id;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {!isAvailable && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertTriangle size={20} />
          <span className="font-medium">This post is no longer available.</span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 sm:p-10 border-white/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-amber-500"></div>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${post.type === 'offer' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
            {post.type.toUpperCase()}
          </span>
          <CategoryChip category={post.category} />
          {post.quantity > 1 && (
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
              Quantity: {post.quantity}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">{post.title}</h1>
        
        {post.model_number && (
          <div className="font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 inline-block px-3 py-1.5 rounded-lg mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
            Model: <span className="font-bold text-gray-900 dark:text-gray-200">{post.model_number}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {post.condition && (
            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/50 text-sm font-medium">
              Condition: {CONDITIONS.find(c => c.value === post.condition)?.label || post.condition}
            </span>
          )}
          {post.share_modes?.map(mode => (
            <span key={mode} className="px-4 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/50 text-sm font-medium capitalize">
              Will {mode}
            </span>
          ))}
        </div>

        <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-5 mb-8 space-y-4 border border-gray-100 dark:border-gray-700/50 shadow-inner">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><MapPin size={20} className="text-brand-500" /></div>
            <span className="text-lg">{post.location}</span>
          </div>
          {post.type === 'request' && post.needed_by && (
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Calendar size={20} className="text-blue-500" /></div>
              <span>Needed by: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(post.needed_by)}</span></span>
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Clock size={20} className="text-gray-400" /></div>
            <span>Posted {timeAgo(post.created_at)} by <span className="font-semibold text-gray-900 dark:text-gray-100">{post.author_name}</span></span>
          </div>
        </div>

        {post.details && (
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Details</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-white/40 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">{post.details}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-200 dark:border-gray-800 pt-8">
          {!isOwner && isAvailable && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContact} 
              disabled={contactLoading}
              className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-[#25D366]/20 rounded-xl"
            >
              <MessageCircle size={24} />
              {contactLoading ? 'Loading...' : 'Contact on WhatsApp'}
            </motion.button>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="btn-secondary flex-1 py-4 text-lg flex items-center justify-center gap-2 rounded-xl"
          >
            <Share2 size={24} />
            Share
          </motion.button>
        </div>
      </motion.div>

      {matches.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-16">
          <h2 className="text-2xl font-extrabold mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 text-gray-900 dark:text-gray-100">Possible Matches</h2>
          <div className="space-y-4">
            {matches.map(m => (
              <PostCard key={m.id} post={m} />
            ))}
          </div>
        </motion.div>
      )}

      {!isOwner && (
        <div className="text-center mt-12 pb-8">
          <button onClick={() => setShowReport(true)} className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 mx-auto bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-full">
            <AlertTriangle size={16} /> Report this post
          </button>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Report Post</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please describe why you are reporting this post.</p>
            <textarea 
              className="input-field w-full h-32 mb-6 resize-none" 
              placeholder="Reason for report..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowReport(false)} className="btn-secondary flex-1 py-3 rounded-xl">Cancel</button>
              <button onClick={handleReport} className="btn-danger flex-1 py-3 rounded-xl">Submit Report</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
