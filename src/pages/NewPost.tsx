import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
      <div className="max-w-xl mx-auto p-8 text-center bg-white card mt-8">
        <h2 className="text-2xl font-bold mb-4">Sign in to post</h2>
        <p className="text-gray-600 mb-6">You need an account to share or request parts.</p>
        <button onClick={() => signIn()} className="btn-primary px-8 py-2">Sign in</button>
      </div>
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
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white card mt-4 md:mt-8 mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {postType === 'offer' ? 'List parts you have' : 'Request parts you need'}
      </h1>
      <PostForm 
        postType={postType}
        onSubmit={handleSubmit}
        submitLabel="Create Post"
        showSaveAndAddAnother={true}
        onSaveAndAddAnother={handleSaveAndAddAnother}
      />
    </div>
  );
}
