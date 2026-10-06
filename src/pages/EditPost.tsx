import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PostForm } from '../components/PostForm';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { PostFormData } from '../lib/schemas';
import type { Post } from '../lib/types';

export function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (error || !data) {
        addToast('Post not found or access denied', 'error');
        navigate('/me');
      } else {
        setPost(data as Post);
      }
      setLoading(false);
    };
    
    fetchPost();
  }, [id, user, navigate, addToast]);

  const handleSubmit = async (data: PostFormData) => {
    if (!id || !user) return;
    
    const { error } = await supabase
      .from('posts')
      .update({
        title: data.title,
        category: data.category,
        model_number: data.model_number || null,
        quantity: data.quantity,
        condition: data.type === 'offer' ? data.condition : null,
        details: data.details || null,
        share_modes: data.share_modes,
        location: data.location,
        needed_by: data.type === 'request' && data.needed_by ? data.needed_by : null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      addToast(error.message, 'error');
      throw error;
    }
    
    addToast('Post updated successfully!', 'success');
    navigate('/me');
  };

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;
  if (!post) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto p-6 sm:p-10 rounded-3xl border border-white/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-xl mt-4 md:mt-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-amber-500"></div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 tracking-tight">
        Edit Post
      </h1>
      <PostForm 
        initialData={post as unknown as Partial<PostFormData>}
        postType={post.type}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </motion.div>
  );
}
