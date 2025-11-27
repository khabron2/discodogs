
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import { User, LogOut, Moon, Sun, Database, Music } from 'lucide-react';

const Profile: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [musicProvider, setMusicProvider] = useState<'spotify' | 'ytmusic'>('spotify');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || 'User');
    };
    checkUser();

    // Theme Check
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }

    // Music Provider Check
    const savedProvider = localStorage.getItem('music_preference');
    if (savedProvider === 'ytmusic') {
      setMusicProvider('ytmusic');
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleProviderChange = (provider: 'spotify' | 'ytmusic') => {
    setMusicProvider(provider);
    localStorage.setItem('music_preference', provider);
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Profile</h1>

      <div className="flex items-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{email.split('@')[0]}</h2>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <div className="flex items-center text-gray-700 dark:text-gray-200">
              {isDark ? <Moon size={20} className="mr-3" /> : <Sun size={20} className="mr-3" />}
              <span className="font-medium">Appearance</span>
            </div>
            <div className="text-sm text-gray-500">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </div>
          </button>

          <div className="h-px bg-gray-100 dark:bg-dark-700 mx-4" />

          {/* Music Provider Preference */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center text-gray-700 dark:text-gray-200">
              <Music size={20} className="mr-3" />
              <span className="font-medium">Music Provider</span>
            </div>
            <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
              <button 
                onClick={() => handleProviderChange('spotify')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${musicProvider === 'spotify' ? 'bg-white dark:bg-dark-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Spotify
              </button>
              <button 
                onClick={() => handleProviderChange('ytmusic')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${musicProvider === 'ytmusic' ? 'bg-white dark:bg-dark-600 shadow-sm text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                YT Music
              </button>
            </div>
          </div>
          
          <div className="h-px bg-gray-100 dark:bg-dark-700 mx-4" />
          
           {/* Instructions for DB Setup */}
           <div className="p-4">
             <div className="flex items-start text-gray-700 dark:text-gray-200">
                <Database size={20} className="mr-3 mt-0.5 text-gray-400" />
                <div>
                  <span className="font-medium block">Data Status</span>
                  <p className="text-xs text-gray-500 mt-1">
                    If ratings fail to save, please ensure you have run the SQL setup script provided in <code>index.tsx</code> in your Supabase dashboard.
                  </p>
                </div>
             </div>
           </div>

          <div className="h-px bg-gray-100 dark:bg-dark-700 mx-4" />

          <button 
            onClick={handleSignOut}
            className="w-full flex items-center p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
