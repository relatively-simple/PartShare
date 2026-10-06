import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PostForm } from '../components/PostForm';
import type { PostFormData } from '../lib/schemas';
import type { PostType } from '../lib/types';

export function NewPost() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, needsOnboarding, signIn } = useAuth();
  const { addToast } = useToast();
  
  const typeParam = searchParams.get('type');
  const postType: PostType = typeParam === 'request' ? 'request' : 'offer';

  React.useEffect(() => {
    if (user === null) {
      // not signed in
    } else if (needsOnboarding) {
      navigate('/onboarding');
    }
  }, [user, needsOnboarding, navigate]);

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto p-12 text-center rounded-3xl border border-white/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-xl mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Sign in to post</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">You need an account to share or request parts.</p>
        <button onClick={() => signIn()} className="btn-primary px-8 py-3 rounded-full">Sign in</button>
      </motion.div>
    );
  }

  const handleSubmit = async (data: PostFormData) => {
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      type: data.type,
      title: data.title,
      category: data.category,
      model_number: data.model_number || null,
      quantity: data.quantity,
      condition: data.type === 'offer' ? data.condition : null,
      details: data.details || null,
      share_modes: data.share_modes,
      location: data.location,
      needed_by: data.type === 'request' && data.needed_by ? data.needed_by : null,
    });

    if (error) {
      addToast(error.message, 'error');
      throw error;
    }
    
    addToast('Post created successfully!', 'success');
    navigate('/me');
  };

  const handleSaveAndAddAnother = async (data: PostFormData) => {
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      type: data.type,
      title: data.title,
      category: data.category,
      model_number: data.model_number || null,
      quantity: data.quantity,
      condition: data.type === 'offer' ? data.condition : null,
      details: data.details || null,
      share_modes: data.share_modes,
      location: data.location,
      needed_by: data.type === 'request' && data.needed_by ? data.needed_by : null,
    });

    if (error) {
      addToast(error.message, 'error');
      throw error;
    }
    addToast('Post created. Add another!', 'success');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto p-6 sm:p-10 rounded-3xl border border-white/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-xl mt-4 md:mt-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-amber-500"></div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 tracking-tight">
        {postType === 'offer' ? 'List parts you have' : 'Request parts you need'}
      </h1>
      <PostForm 
        postType={postType}
        onSubmit={handleSubmit}
        submitLabel="Create Post"
        showSaveAndAddAnother={true}
        onSaveAndAddAnother={handleSaveAndAddAnother}
      />
    </motion.div>
  );
}
