import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { Music } from 'lucide-react';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-dark-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
            <Music className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">DiscogStats</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Your personal music journey tracker.</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-dark-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;