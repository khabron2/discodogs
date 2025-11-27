
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Collection from './pages/Collection';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 0. Check for Spotify Auth Callback (Hash)
    // When using HashRouter, the hash contains the route AND possibly the query params from Spotify
    const hash = window.location.hash;
    
    // Spotify returns: http://domain/#access_token=...
    // HashRouter sees: Route = #access_token=...
    if (hash && hash.includes('access_token')) {
      try {
        // Extract token roughly
        const tokenMatch = hash.match(/access_token=([^&]*)/);
        const token = tokenMatch ? tokenMatch[1] : null;
        
        if (token) {
          localStorage.setItem('spotify_user_token', token);
          console.log("Spotify token saved successfully");
          // Clean URL immediately to avoid router confusion
          // Use setTimeout to allow React to process before navigation
          setTimeout(() => {
             window.location.hash = '/';
          }, 100);
        }
      } catch (e) {
        console.error("Error parsing spotify token", e);
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
