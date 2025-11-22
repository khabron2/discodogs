import React, { useEffect, useState } from 'react';
import { getUserAchievements, supabase } from '../services/supabaseService';
import { ACHIEVEMENTS_LIST } from '../constants';
import { Lock, CheckCircle } from 'lucide-react';

const Achievements: React.FC = () => {
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await getUserAchievements(user.id);
        if (data) {
          setUnlocked(data.map((item: any) => item.achievement_id));
        }
      }
    };
    fetch();
  }, []);

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Achievements</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Unlock badges as you listen.</p>

      <div className="grid grid-cols-2 gap-4">
        {ACHIEVEMENTS_LIST.map((ach) => {
          const isUnlocked = unlocked.includes(ach.id);
          return (
            <div 
              key={ach.id} 
              className={`p-4 rounded-2xl border relative overflow-hidden ${
                isUnlocked 
                  ? 'bg-white dark:bg-dark-800 border-brand-500/30 shadow-sm' 
                  : 'bg-gray-50 dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 opacity-75 grayscale'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400' : 'bg-gray-200 dark:bg-dark-700 text-gray-400'}`}>
                   {/* Simple icon map based on ID prefix just for visual variety in demo */}
                   <span className="text-xl font-bold">{ach.icon === 'star' ? '★' : ach.icon === 'music' ? '♫' : '●'}</span>
                </div>
                {isUnlocked ? <CheckCircle size={16} className="text-brand-500" /> : <Lock size={16} className="text-gray-400" />}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{ach.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{ach.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;