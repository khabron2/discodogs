import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseService';
import { Session } from '@supabase/supabase-js';

// Components
import BottomNav from './components/BottomNav';

// Pages
import Auth from './pages/Auth';
import Home from './pages/Home';
import Search from './pages/Search';
import Artist from './pages/Artist';
import Album from './pages/Album';
import Stats from './pages/Stats';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';

// Simple Collection Page (reusing logic for demo)
const Collection = () => (
  <div className="p-6 pb-24 max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">My Collection</h1>
    <p className="text-gray-500">Albums you have completed will appear here.</p>
    {/* In a full app, query 'completed_albums' table */}
    <div className="mt-8 text-center py-12 bg-white dark:bg-dark-800 rounded-xl border border-dashed border-gray-300 dark:border-dark-600">
       <p className="text-gray-400">Start rating albums to build your collection!</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 0. Check for Spotify Auth Callback (Hash)
    // When using BrowserRouter, the hash is preserved in window.location.hash
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1)); // remove the #
      const token = params.get('access_token');
      if (token) {
        localStorage.setItem('spotify_user_token', token);
        // Clear hash to clean URL so it doesn't look messy
        window.history.pushState("", document.title, window.location.pathname);
      }
    }

    // 1. Get Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 font-sans">
        {!session ? (
          <Routes>
            <Route path="*" element={<Auth />} />
          </Routes>
        ) : (
          <>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/artist/:id" element={<Artist />} />
              <Route path="/album/:id" element={<Album />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </>
        )}
      </div>
    </Router>
  );
};

export default App;