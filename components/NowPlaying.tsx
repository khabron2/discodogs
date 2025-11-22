import React, { useEffect, useState } from 'react';
import { authorizeSpotifyUser, getNowPlaying } from '../services/spotifyService';
import { Music, RefreshCw, Wifi, PlayCircle } from 'lucide-react';

const NowPlaying: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('spotify_user_token'));
  const [track, setTrack] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    if (token) {
      fetchNowPlaying();
      // Poll every 10 seconds
      const interval = setInterval(fetchNowPlaying, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNowPlaying = async () => {
    if (!token) return;
    setLoading(true);
    const data = await getNowPlaying(token);
    if (data && data.item) {
      setTrack(data.item);
      setIsPlaying(data.is_playing);
    } else {
      setIsPlaying(false);
    }
    setLoading(false);
  };

  const handleConnect = () => {
    authorizeSpotifyUser();
  };

  if (!token) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-black dark:from-black dark:to-gray-900 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between relative overflow-hidden border border-gray-800">
         <div className="z-10">
           <h3 className="font-bold text-sm flex items-center">
             <Music size={16} className="mr-2 text-brand-500" />
             Connect Spotify
           </h3>
           <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
             Enable "Now Playing" to see your live music activity here.
           </p>
         </div>
         <button 
           onClick={handleConnect}
           className="z-10 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-full text-xs transition-all transform active:scale-95"
         >
           Connect
         </button>
         {/* Background Decoration */}
         <Music className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
      </div>
    );
  }

  if (!isPlaying || !track) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 border border-gray-200 dark:border-dark-700 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center text-gray-400">
            <Music size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Not playing</p>
            <p className="text-xs text-gray-500">Open Spotify to start</p>
          </div>
        </div>
        <button onClick={fetchNowPlaying} className="text-gray-400 hover:text-brand-500 transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-900/90 to-gray-900 rounded-2xl p-4 shadow-lg border border-green-900/50 relative overflow-hidden group">
      
      {/* Animated Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="relative w-12 h-12 flex-shrink-0">
            <img 
              src={track.album.images[0]?.url} 
              alt="Album Art" 
              className="w-full h-full rounded-lg shadow-md object-cover animate-[spin_10s_linear_infinite]"
            />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10"></div>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-brand-400 mb-0.5">
              <span className="flex space-x-0.5 h-2 items-end">
                <span className="w-0.5 h-1.5 bg-brand-400 animate-[bounce_1s_infinite]"></span>
                <span className="w-0.5 h-2.5 bg-brand-400 animate-[bounce_1.2s_infinite]"></span>
                <span className="w-0.5 h-1 bg-brand-400 animate-[bounce_0.8s_infinite]"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Now Playing</span>
            </div>
            <h3 className="text-sm font-bold text-white truncate pr-2">{track.name}</h3>
            <p className="text-xs text-gray-300 truncate">{track.artists.map((a: any) => a.name).join(', ')}</p>
          </div>
        </div>

        <div className="flex-shrink-0 pl-2">
           <Wifi size={18} className="text-brand-500/50" />
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
