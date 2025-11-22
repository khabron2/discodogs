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
    // Removed border-t and ensured exact hex match with theme-color (#181818)
    // This blends the app navigation with the Android system navigation bar
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{ backgroundColor: '#181818' }} 
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive(item.path) 
                ? 'text-brand-500' 
                : 'text-gray-500 hover:text-gray-300'
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