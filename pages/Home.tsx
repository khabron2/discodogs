
import React, { useEffect, useState } from 'react';
import { getUserRatings, supabase } from '../services/supabaseService';
import { UserRating } from '../types';
import { Star, TrendingUp, Clock, Disc, Database, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SQL_SETUP_SCRIPT } from '../constants';
import NowPlaying from '../components/NowPlaying';

const Home: React.FC = () => {
  const [recentRatings, setRecentRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRatings: 0, avgScore: 0, topGenre: '-' });
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const ratings = await getUserRatings(user.id);
          setRecentRatings(ratings.slice(0, 5));
          
          // Simple Stats Calculation
          if (ratings.length > 0) {
            const total = ratings.length;
            const avg = ratings.reduce((acc, curr) => acc + curr.rating, 0) / total;
            
            // Simple Genre Mode
            const genres = ratings.map(r => r.genre).filter(Boolean);
            const genreCounts: Record<string, number> = {};
            let maxGenre = '-';
            let maxCount = 0;
            
            genres.forEach(g => {
              const genre = g as string;
              genreCounts[genre] = (genreCounts[genre] || 0) + 1;
              if (genreCounts[genre] > maxCount) {
                maxCount = genreCounts[genre];
                maxGenre = genre;
              }
            });

            setStats({
              totalRatings: total,
              avgScore: parseFloat(avg.toFixed(1)),
              topGenre: maxGenre
            });
          }
        } catch (err: any) {
          console.error("Failed to load home data", err);
          const msg = err.message || "Failed to load data";
          setError(msg);
          
          // Check if error is due to missing table/view
          if (
            msg.includes('Could not find the table') || 
            msg.includes('relation "public.ratings" does not exist') ||
            msg.includes('relation "ratings" does not exist') 
          ) {
            setNeedsSetup(true);
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-6 pt-12 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;
  }

  // Render Setup Screen if tables are missing
  if (needsSetup) {
    return (
      <div className="p-6 pb-24 max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-2xl p-6 mb-6">
          <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
            <Database className="mr-3" size={28} />
            <h1 className="text-xl font-bold">Database Setup Required</h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The database connection is working, but the required view (<code>ratings</code>) was not found.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            To fix this, ensure your Supabase project has the <code>ratings</code> view configured as per the schema.
          </p>
          
          <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-xs font-mono text-gray-400">schema_reference.sql</span>
              <button 
                onClick={handleCopySQL}
                className="flex items-center space-x-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-2 py-1 rounded transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed">
              {SQL_SETUP_SCRIPT}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-8 max-w-2xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Let's explore some music.</p>
        </div>
        <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400">
          <Disc size={20} />
        </div>
      </header>

      {/* NEW: Now Playing Widget */}
      <section>
        <NowPlaying />
      </section>

      {/* Error Banner (Non-critical) */}
      {error && !needsSetup && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
          <p className="font-bold">Note:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center space-x-2 text-brand-500 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Ratings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRatings}</p>
          <p className="text-xs text-gray-500">Total Songs Rated</p>
        </div>
        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center space-x-2 text-yellow-500 mb-2">
            <Star size={18} fill="currentColor" />
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgScore}</p>
          <p className="text-xs text-gray-500">Personal Average</p>
        </div>
      </div>

      {/* Action Banner */}
      <Link to="/search" className="block group">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">Rate a new album</h3>
            <p className="text-brand-100 text-sm">Find your favorite artists and start rating.</p>
          </div>
          <Disc className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 transform rotate-12 group-hover:rotate-45 transition-transform duration-500" />
        </div>
      </Link>

      {/* Recent Activity */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock size={18} className="mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentRatings.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-dark-800 rounded-xl border border-dashed border-gray-300 dark:border-dark-600">
              <p className="text-gray-500 text-sm">No ratings yet. Go explore!</p>
            </div>
          ) : (
            recentRatings.map((rating) => (
              <div key={rating.id || rating.song_id} className="bg-white dark:bg-dark-800 p-3 rounded-xl border border-gray-100 dark:border-dark-700 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3 overflow-hidden">
                  
                  {/* Render Image if available */}
                  <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {rating.album_art_url ? (
                       <img src={rating.album_art_url} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-xs font-bold text-gray-500">{rating.rating}</span>
                    )}
                  </div>

                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {rating.song_name || `Song ID: ${rating.song_id.substring(0, 8)}...`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                        {rating.artist_name || 'Unknown Artist'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1 items-center">
                  <span className="text-xs font-bold mr-2 text-gray-400">{rating.rating}</span>
                  {[...Array(Math.min(rating.rating, 5))].map((_, i) => (
                     <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
