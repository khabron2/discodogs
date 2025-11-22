import React from 'react';
import { Home, Search, BarChart2, User, Disc } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Disc, label: 'Library', path: '/collection' },
    { icon: BarChart2, label: 'Stats', path: '/stats' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    // Changed background to fully opaque dark-800 to match theme-color meta tag
    // This creates the illusion that the app extends behind the system navigation bar
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive(item.path) 
                ? 'text-brand-500 dark:text-brand-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;