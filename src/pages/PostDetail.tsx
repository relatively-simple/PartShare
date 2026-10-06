import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span className="font-medium">This post is no longer available.</span>
        </div>
      )}

      <div className="card p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${post.type === 'offer' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
            {post.type.toUpperCase()}
          </span>
          <CategoryChip category={post.category} />
          {post.quantity > 1 && (
            <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
              Quantity: {post.quantity}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
        
        {post.model_number && (
          <div className="font-mono text-gray-600 bg-gray-50 inline-block px-2 py-1 rounded mb-4">
            Model: {post.model_number}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {post.condition && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-sm font-medium">
              Condition: {CONDITIONS.find(c => c.value === post.condition)?.label || post.condition}
            </span>
          )}
          {post.share_modes?.map(mode => (
            <span key={mode} className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-sm font-medium capitalize">
              Will {mode}
            </span>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={18} className="text-gray-400" />
            <span>{post.location}</span>
          </div>
          {post.type === 'request' && post.needed_by && (
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar size={18} className="text-gray-400" />
              <span>Needed by: <span className="font-medium">{formatDate(post.needed_by)}</span></span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={18} className="text-gray-400" />
            <span>Posted {timeAgo(post.created_at)} by <span className="font-medium">{post.author_name}</span></span>
          </div>
        </div>

        {post.details && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Details</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{post.details}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 border-t pt-6">
          {!isOwner && isAvailable && (
            <button 
              onClick={handleContact} 
              disabled={contactLoading}
              className="btn-primary flex-1 py-3 text-lg flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
            >
              <MessageCircle size={22} />
              {contactLoading ? 'Loading...' : 'Contact on WhatsApp'}
            </button>
          )}
          
          <button 
            onClick={handleShare}
            className="btn-secondary flex-1 py-3 text-lg flex items-center justify-center gap-2"
          >
            <Share2 size={22} />
            Share
          </button>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Possible Matches</h2>
          <div className="space-y-4">
            {matches.map(m => (
              <PostCard key={m.id} post={m} />
            ))}
          </div>
        </div>
      )}

      {!isOwner && (
        <div className="text-center mt-8">
          <button onClick={() => setShowReport(true)} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 mx-auto">
            <AlertTriangle size={14} /> Report this post
          </button>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Report Post</h3>
            <p className="text-sm text-gray-600 mb-4">Please describe why you are reporting this post.</p>
            <textarea 
              className="input-field w-full h-24 mb-4" 
              placeholder="Reason for report..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowReport(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReport} className="btn-danger flex-1">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
