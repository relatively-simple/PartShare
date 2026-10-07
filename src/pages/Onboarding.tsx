import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { profileSchema } from '../lib/schemas';

export function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    display_name: '',
    whatsapp: '',
    location: '',
    consent: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);

  useEffect(() => {
    if (user?.user_metadata) {
      setFormData(prev => ({
        ...prev,
        display_name: user.user_metadata.full_name || user.user_metadata.name || ''
      }));
    }
    
    const fetchLocations = async () => {
      const { data } = await supabase.from('posts').select('location').eq('status', 'open').gt('expires_at', new Date().toISOString());
      if (data) {
        setUniqueLocations([...new Set(data.map(l => l.location))]);
      }
    };
    fetchLocations();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    let parsedData;
    try {
      parsedData = profileSchema.parse(formData);
      setErrors({});
    } catch (err: any) {
      const newErrors: Record<string, string> = {};
      err.issues.forEach((issue: any) => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    const digits = parsedData.whatsapp.replace(/[^\d]/g, '');
    
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: parsedData.display_name,
      whatsapp: digits,
      location: parsedData.location
    });
    
    setLoading(false);
    
    if (error) {
      addToast(error.message, 'error');
    } else {
      await refreshProfile();
      addToast('Welcome to PartShare!', 'success');
      navigate('/');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto p-8 rounded-3xl border border-white/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-xl mt-12 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-orange-500"></div>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to PartShare!</h1>
        <p className="text-gray-600 dark:text-gray-400">Set up your profile to start sharing parts</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label">Display Name *</label>
          <input 
            type="text" 
            className="input-field w-full py-3" 
            value={formData.display_name}
            onChange={e => setFormData({...formData, display_name: e.target.value})}
          />
          {errors.display_name && <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>}
        </div>
        
        <div>
          <label className="label">WhatsApp Number *</label>
          <input 
            type="text" 
            className="input-field w-full font-mono py-3" 
            placeholder="+1234567890"
            value={formData.whatsapp}
            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
          />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 ml-1">Include country code (e.g. +1... or +44...)</p>
          {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
        </div>
        
        <div>
          <label className="label">Default Location *</label>
          <input 
            type="text" 
            className="input-field w-full py-3" 
            list="locations"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
          />
          <datalist id="locations">
            {uniqueLocations.map(loc => <option key={loc} value={loc} />)}
          </datalist>
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>
        
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 rounded text-brand-500 focus:ring-brand-500 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              checked={formData.consent}
              onChange={e => setFormData({...formData, consent: e.target.checked})}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
              I agree that my WhatsApp number will be shown to signed-in members when they tap "Contact" on my posts.
            </span>
          </label>
          {errors.consent && <p className="text-red-500 text-sm mt-1">{errors.consent}</p>}
        </div>
        
        <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-2 text-lg rounded-xl shadow-lg shadow-brand-500/20">
          {loading ? 'Saving...' : 'Complete Setup'}
        </button>
      </form>
    </motion.div>
  );
}
