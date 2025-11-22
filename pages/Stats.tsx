
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getUserRatings } from '../services/supabaseService';
import { supabase } from '../services/supabaseService';
import { UserRating } from '../types';
import { BarChart2, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const Stats: React.FC = () => {
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await getUserRatings(user.id);
        setRatings(data);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="p-6 text-center dark:text-white">Crunching numbers...</div>;

  // Process Data
  const scoreDistribution = Array(10).fill(0).map((_, i) => ({ score: i + 1, count: 0 }));
  ratings.forEach(r => {
    if (r.rating >= 1 && r.rating <= 10) {
      scoreDistribution[r.rating - 1].count += 1;
    }
  });

  const totalSongs = ratings.length;
  const averageScore = totalSongs > 0 ? (ratings.reduce((a, b) => a + b.rating, 0) / totalSongs).toFixed(2) : '0';
  const highestRated = ratings.filter(r => r.rating === 10).length;

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
        <BarChart2 className="mr-2 text-brand-500" /> Your Stats
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-dark-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSongs}</div>
          <div className="text-[10px] uppercase text-gray-500 font-semibold">Rated</div>
        </div>
        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-dark-700">
          <div className="text-2xl font-bold text-brand-500">{averageScore}</div>
          <div className="text-[10px] uppercase text-gray-500 font-semibold">Avg</div>
        </div>
        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-dark-700">
          <div className="text-2xl font-bold text-yellow-500">{highestRated}</div>
          <div className="text-[10px] uppercase text-gray-500 font-semibold">10/10s</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">Score Distribution</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution}>
              <XAxis dataKey="score" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.score >= 8 ? '#22c55e' : entry.score >= 5 ? '#3b82f6' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Link to="/achievements" className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-2xl text-white shadow-lg">
         <div className="flex items-center">
           <Award className="mr-3" size={24} />
           <div>
             <div className="font-bold">Achievements</div>
             <div className="text-xs text-indigo-200">View your unlocked badges</div>
           </div>
         </div>
         <div className="bg-white/20 p-2 rounded-full">
            <Award size={16} />
         </div>
      </Link>
    </div>
  );
};

export default Stats;
