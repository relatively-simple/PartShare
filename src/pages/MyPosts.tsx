import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PostCard } from '../components/PostCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Post } from '../lib/types';
import { profileSchema } from '../lib/schemas';
import { daysUntil } from '../lib/utils';

export function MyPosts() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: profile?.display_name || '',
    whatsapp: profile?.whatsapp ? `+${profile.whatsapp}` : '',
    location: profile?.location || ''
  });

  const [stats, setStats] = useState<Record<string, { contact_taps: number; match_count: number }>>({});

  const fetchMyPosts = async () => {
    if (!user) return;
    const [{ data: postsData }, { data: statsData }] = await Promise.all([
      supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.rpc('my_post_stats')
    ]);
    
    if (postsData) setPosts(postsData as Post[]);
    if (statsData) {
      const statsMap: Record<string, any> = {};
      (statsData as any[]).forEach(s => {
        statsMap[s.post_id] = { contact_taps: s.contact_taps, match_count: s.match_count };
      });
      setStats(statsMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) navigate('/');
    else fetchMyPosts();
  }, [user, navigate]);

  const handleProfileSave = async () => {
    try {
      // Validate minus consent
      const parsedData = profileSchema.parse({ ...profileData, consent: true });
      const digits = parsedData.whatsapp.replace(/[^\d]/g, '');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: parsedData.display_name,
          whatsapp: digits,
          location: parsedData.location
        })
        .eq('id', user!.id);
        
      if (error) throw error;
      
      await refreshProfile();
      setIsEditingProfile(false);
      addToast('Profile updated', 'success');
    } catch (err: any) {
      addToast(err.issues?.[0]?.message || 'Invalid profile data', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account and all your posts? This cannot be undone.')) return;
    
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Account deleted', 'info');
      signOut();
      navigate('/');
    }
  };

  const updatePostStatus = async (id: string, status: 'done') => {
    const { error } = await supabase.from('posts').update({ status }).eq('id', id);
    if (!error) {
      addToast('Post updated', 'success');
      fetchMyPosts();
    }
  };

  const renewPost = async (id: string) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 60);
    const { error } = await supabase.from('posts').update({ expires_at: newExpiry.toISOString() }).eq('id', id);
    if (!error) {
      addToast('Post renewed for 60 days', 'success');
      fetchMyPosts();
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      addToast('Post deleted', 'success');
      fetchMyPosts();
    }
  };

  return (
    <div className="w-full mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 sm:p-8 border-white/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Profile</h2>
        {isEditingProfile ? (
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="label">Name</label>
              <input type="text" className="input-field w-full py-2.5" value={profileData.display_name} onChange={e => setProfileData({...profileData, display_name: e.target.value})} />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input type="text" className="input-field w-full py-2.5" value={profileData.whatsapp} onChange={e => setProfileData({...profileData, whatsapp: e.target.value})} placeholder="+1234567890" />
            </div>
            <div>
              <label className="label">Default Location</label>
              <input type="text" className="input-field w-full py-2.5" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleProfileSave} className="btn-primary flex-1 py-2.5">Save</button>
              <button onClick={() => setIsEditingProfile(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-3 mb-8 text-gray-700 dark:text-gray-300">
              <p><span className="font-semibold text-gray-900 dark:text-gray-100 w-24 inline-block">Name:</span> {profile?.display_name}</p>
              <p><span className="font-semibold text-gray-900 dark:text-gray-100 w-24 inline-block">Location:</span> {profile?.location}</p>
              <p><span className="font-semibold text-gray-900 dark:text-gray-100 w-24 inline-block">WhatsApp:</span> ...{profile?.whatsapp?.slice(-4)}</p>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <button onClick={() => setIsEditingProfile(true)} className="btn-secondary text-sm">Edit Profile</button>
              <button onClick={handleDeleteAccount} className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline transition-colors ml-auto">Delete Account</button>
            </div>
          </div>
        )}
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Posts</h2>
        {loading ? <div className="p-8"><LoadingSpinner /></div> : (
          posts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState icon={<Package size={32} />} title="No posts yet" description="Share parts you don't need or request parts you're looking for." />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {posts.map((post, index) => {
                const daysExp = daysUntil(post.expires_at);
                const isNearExpiry = daysExp <= 7;
                
                return (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={post.id} className="card p-0 overflow-hidden flex flex-col sm:flex-row border-white/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl">
                    <div className="flex-1 pointer-events-none p-4 pb-0 sm:pb-4 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800">
                      <div className="pointer-events-auto">
                        <PostCard post={post} showStatus />
                        {stats[post.id] && (
                          <div className="mt-4 mx-4 mb-4 sm:mb-0 flex gap-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <span>👁 {stats[post.id].contact_taps} Contact Taps</span>
                            <span>✨ {stats[post.id].match_count} Matches</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-800/30 p-5 sm:w-56 flex flex-col gap-3 justify-center">
                      <div className="text-sm font-medium text-center text-gray-500 dark:text-gray-400 mb-1">
                        {daysExp > 0 ? `Expires in ${daysExp} days` : 'Expired'}
                      </div>
                      <button onClick={() => navigate(`/edit/${post.id}`)} className="btn-secondary text-sm py-2 w-full shadow-sm">Edit</button>
                      {post.status === 'open' && (
                        <button onClick={() => updatePostStatus(post.id, 'done')} className="btn-secondary text-sm py-2 w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 shadow-sm">
                          Mark as {post.type === 'offer' ? 'Taken' : 'Found'}
                        </button>
                      )}
                      {(daysExp <= 7 || daysExp < 0) && (
                        <button onClick={() => renewPost(post.id)} className="btn-secondary text-sm py-2 w-full shadow-sm">Renew (60 days)</button>
                      )}
                      <button onClick={() => deletePost(post.id)} className="btn-danger text-sm py-2 w-full shadow-sm">Delete</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
