import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    
    try {
      profileSchema.parse(formData);
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
    const digits = formData.whatsapp.replace(/[^\d]/g, '');
    
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: formData.display_name,
      whatsapp: digits,
      location: formData.location
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
    <div className="max-w-md mx-auto p-6 bg-white card mt-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Welcome to PartShare!</h1>
        <p className="text-gray-600">Set up your profile to start sharing parts</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Display Name *</label>
          <input 
            type="text" 
            className="input-field w-full" 
            value={formData.display_name}
            onChange={e => setFormData({...formData, display_name: e.target.value})}
          />
          {errors.display_name && <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>}
        </div>
        
        <div>
          <label className="label">WhatsApp Number *</label>
          <input 
            type="text" 
            className="input-field w-full font-mono" 
            placeholder="+1234567890"
            value={formData.whatsapp}
            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
          />
          <p className="text-xs text-gray-500 mt-1">Include country code (e.g. +1... or +44...)</p>
          {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
        </div>
        
        <div>
          <label className="label">Default Location *</label>
          <input 
            type="text" 
            className="input-field w-full" 
            list="locations"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
          />
          <datalist id="locations">
            {uniqueLocations.map(loc => <option key={loc} value={loc} />)}
          </datalist>
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>
        
        <div>
          <label className="flex items-start gap-3 cursor-pointer mt-4">
            <input 
              type="checkbox" 
              className="mt-1 rounded text-amber-600"
              checked={formData.consent}
              onChange={e => setFormData({...formData, consent: e.target.checked})}
            />
            <span className="text-sm text-gray-700">
              I agree that my WhatsApp number will be shown to signed-in members when they tap "Contact" on my posts.
            </span>
          </label>
          {errors.consent && <p className="text-red-500 text-sm mt-1">{errors.consent}</p>}
        </div>
        
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-6 text-lg">
          {loading ? 'Saving...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}
