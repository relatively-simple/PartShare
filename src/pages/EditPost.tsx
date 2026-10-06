import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white card mt-4 md:mt-8 mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Post
      </h1>
      <PostForm 
        initialData={post as unknown as Partial<PostFormData>}
        postType={post.type}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  );
}
