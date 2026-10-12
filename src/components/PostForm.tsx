import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PostType } from '../lib/types';
import type { PostFormData } from '../lib/schemas';
import { postSchema } from '../lib/schemas';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES, CONDITIONS, SHARE_MODES } from '../config';
import { supabase } from '../lib/supabase';

interface PostFormProps {
  initialData?: Partial<PostFormData>;
  postType: PostType;
  onSubmit: (data: PostFormData) => Promise<void>;
  submitLabel: string;
  showSaveAndAddAnother?: boolean;
  onSaveAndAddAnother?: (data: PostFormData) => Promise<void>;
}

export function PostForm({ initialData, postType, onSubmit, submitLabel, showSaveAndAddAnother, onSaveAndAddAnother }: PostFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<Partial<PostFormData>>(initialData || {
    type: postType,
    quantity: 1,
    share_modes: ['give'],
    location: profile?.location || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const handleTypeToggle = (newType: PostType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      condition: newType === 'offer' ? (prev.condition || 'used_working') : null,
      needed_by: newType === 'request' ? (prev.needed_by || '') : undefined,
    }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.condition;
      delete copy.needed_by;
      return copy;
    });
  };

  useEffect(() => {
    if (!initialData?.location && profile?.location && !formData.location) {
      setFormData(prev => ({ ...prev, location: profile.location }));
    }
  }, [profile?.location, initialData?.location]);

  useEffect(() => {
    if (!formData.title || formData.title.length < 3) {
      setMatchCount(0);
      return;
    }
    const currentType = formData.type || postType;
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('match_posts', {
        p_for_type: currentType,
        p_title: formData.title,
        p_model: formData.model_number || null,
        p_category: formData.category || null,
      });
      setMatchCount(data?.length || 0);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.title, formData.model_number, formData.category, formData.type, postType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'share_modes') {
        const modes = formData.share_modes || [];
        if (checked) {
          setFormData({ ...formData, share_modes: [...modes, value as any] });
        } else {
          setFormData({ ...formData, share_modes: modes.filter(m => m !== value) });
        }
      }
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value, 10) || 1 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    try {
      postSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err: any) {
      if (err.issues) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((issue: any) => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent, isSaveAndAdd = false) => {
    e.preventDefault();
    if (honeypot) return; // bot detected
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      if (isSaveAndAdd && onSaveAndAddAnother) {
        await onSaveAndAddAnother(formData as PostFormData);
        // Reset mostly, keep location, share_modes, and current type
        setFormData({
          type: formData.type || postType,
          quantity: 1,
          share_modes: formData.share_modes,
          location: formData.location
        });
      } else {
        await onSubmit(formData as PostFormData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* Honeypot */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} value={honeypot} onChange={e => setHoneypot(e.target.value)} />
      </div>

      {/* Post Type Selector (Offer vs Request) */}
      <div className="space-y-2">
        <label className="label text-base font-semibold">What would you like to do? *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => handleTypeToggle('offer')}
            className={`py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              formData.type === 'offer'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.01]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span>📦 I have parts (Available)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeToggle('request')}
            className={`py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              formData.type === 'request'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span>🔍 I need parts (Wanted)</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
          {formData.type === 'offer' 
            ? '📦 This will be listed under "Available Parts" for others to browse.'
            : '🔍 This will be listed under "Wanted Parts" to ask the community for help.'}
        </p>
      </div>

      {matchCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 p-3.5 rounded-xl text-sm flex items-center justify-between gap-2 shadow-sm">
          <span>
            {formData.type === 'offer' 
              ? `💡 Someone is looking for this! Found ${matchCount} maker request${matchCount > 1 ? 's' : ''}.`
              : `💡 Someone already has this! Found ${matchCount} possible match${matchCount > 1 ? 'es' : ''}.`}
          </span>
          <Link 
            to={`/?tab=${formData.type === 'offer' ? 'request' : 'offer'}&q=${encodeURIComponent(formData.model_number || formData.title || '')}`} 
            target="_blank" 
            className="font-semibold underline whitespace-nowrap ml-2 text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            View Matches
          </Link>
        </div>
      )}

      <div>
        <label className="label">Title *</label>
        <input 
          type="text" 
          name="title" 
          className="input-field w-full" 
          value={formData.title || ''} 
          onChange={handleChange} 
          placeholder={formData.type === 'offer' ? "e.g. Arduino Uno R3 (or components you have)" : "e.g. Arduino Uno R3 (or part you need)"} 
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select name="category" className="input-field w-full" value={formData.category || ''} onChange={handleChange}>
            <option value="">Select a category</option>
            {CATEGORIES.map(({ value: val, label }) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="label">Quantity *</label>
          <input type="number" name="quantity" className="input-field w-full" min="1" value={formData.quantity || 1} onChange={handleChange} />
          {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
        </div>
      </div>

      <div>
        <label className="label">Model Number (Optional)</label>
        <input type="text" name="model_number" className="input-field w-full font-mono" value={formData.model_number || ''} onChange={handleChange} placeholder="e.g. A000066" />
        {errors.model_number && <p className="text-red-500 text-sm mt-1">{errors.model_number}</p>}
      </div>

      {formData.type === 'offer' && (
        <div>
          <label className="label">Condition *</label>
          <select name="condition" className="input-field w-full" value={formData.condition || ''} onChange={handleChange}>
            <option value="">Select condition</option>
            {CONDITIONS.map(({ value: val, label }) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
        </div>
      )}

      {formData.type === 'request' && (
        <div>
          <label className="label">Needed By (Optional)</label>
          <input type="date" name="needed_by" className="input-field w-full" value={formData.needed_by || ''} onChange={handleChange} />
          {errors.needed_by && <p className="text-red-500 text-sm mt-1">{errors.needed_by}</p>}
        </div>
      )}

      <div>
        <label className="label">Details (Optional)</label>
        <textarea name="details" className="input-field w-full h-32" value={formData.details || ''} onChange={handleChange} placeholder="Describe what you have or what you need..." />
        {errors.details && <p className="text-red-500 text-sm mt-1">{errors.details}</p>}
      </div>

      <div>
        <label className="label">Share Modes *</label>
        <div className="flex gap-4">
          {SHARE_MODES.map(({ value: val, label }) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="share_modes" value={val} checked={(formData.share_modes || []).includes(val as any)} onChange={handleChange} className="rounded text-amber-600 focus:ring-amber-500" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {errors.share_modes && <p className="text-red-500 text-sm mt-1">{errors.share_modes}</p>}
      </div>

      <div>
        <label className="label">Location *</label>
        <input type="text" name="location" className="input-field w-full" value={formData.location || ''} onChange={handleChange} placeholder="e.g. Engineering Building, Room 101" />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
        <button type="submit" className="btn-primary flex-1 py-2" disabled={loading}>
          {loading ? 'Submitting...' : submitLabel}
        </button>
        {showSaveAndAddAnother && onSaveAndAddAnother && (
          <button type="button" onClick={(e) => handleSubmit(e, true)} className="btn-secondary flex-1 py-2" disabled={loading}>
            Save & Add Another
          </button>
        )}
      </div>
    </form>
  );
}
