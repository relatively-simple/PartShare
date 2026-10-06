import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      profileSchema.parse({ ...profileData, consent: true });
      const digits = profileData.whatsapp.replace(/[^\d]/g, '');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          whatsapp: digits,
          location: profileData.location
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
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="card p-6 bg-white">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>
        {isEditingProfile ? (
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="label">Name</label>
              <input type="text" className="input-field w-full" value={profileData.display_name} onChange={e => setProfileData({...profileData, display_name: e.target.value})} />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input type="text" className="input-field w-full" value={profileData.whatsapp} onChange={e => setProfileData({...profileData, whatsapp: e.target.value})} placeholder="+1234567890" />
            </div>
            <div>
              <label className="label">Default Location</label>
              <input type="text" className="input-field w-full" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleProfileSave} className="btn-primary flex-1">Save</button>
              <button onClick={() => setIsEditingProfile(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-2 mb-4 text-gray-700">
              <p><span className="font-medium w-24 inline-block">Name:</span> {profile?.display_name}</p>
              <p><span className="font-medium w-24 inline-block">Location:</span> {profile?.location}</p>
              <p><span className="font-medium w-24 inline-block">WhatsApp:</span> ...{profile?.whatsapp?.slice(-4)}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsEditingProfile(true)} className="btn-secondary text-sm">Edit Profile</button>
              <button onClick={handleDeleteAccount} className="text-sm text-red-600 hover:underline">Delete Account</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">My Posts</h2>
        {loading ? <LoadingSpinner /> : (
          posts.length === 0 ? (
            <EmptyState icon={<Package size={32} />} title="No posts yet" description="Share parts you don't need or request parts you're looking for." />
          ) : (
            <div className="space-y-4">
              {posts.map(post => {
                const daysExp = daysUntil(post.expires_at);
                const isNearExpiry = daysExp <= 7;
                
                return (
                  <div key={post.id} className="card p-0 overflow-hidden flex flex-col sm:flex-row">
                    <div className="flex-1 pointer-events-none p-4 pb-0 sm:pb-4 border-b sm:border-b-0 sm:border-r">
                      <div className="pointer-events-auto">
                        <PostCard post={post} showStatus />
                        {stats[post.id] && (
                          <div className="mt-4 flex gap-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span>👁 {stats[post.id].contact_taps} Contact Taps</span>
                            <span>✨ {stats[post.id].match_count} Matches</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 sm:w-48 flex flex-col gap-2 justify-center">
                      <div className="text-xs text-center text-gray-500 mb-2">
                        {daysExp > 0 ? `Expires in ${daysExp} days` : 'Expired'}
                      </div>
                      <button onClick={() => navigate(`/edit/${post.id}`)} className="btn-secondary text-sm py-1 w-full">Edit</button>
                      {post.status === 'open' && (
                        <button onClick={() => updatePostStatus(post.id, 'done')} className="btn-secondary text-sm py-1 w-full bg-blue-50 text-blue-700 border-blue-200">
                          Mark as {post.type === 'offer' ? 'Taken' : 'Found'}
                        </button>
                      )}
                      {(daysExp <= 7 || daysExp < 0) && (
                        <button onClick={() => renewPost(post.id)} className="btn-secondary text-sm py-1 w-full">Renew (60 days)</button>
                      )}
                      <button onClick={() => deletePost(post.id)} className="btn-danger text-sm py-1 w-full">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
