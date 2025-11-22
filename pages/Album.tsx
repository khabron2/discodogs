
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAlbumDetails } from '../services/spotifyService';
import { upsertRating, getAlbumRatings, checkAchievements, supabase } from '../services/supabaseService';
import { SpotifyAlbum, SpotifyTrack } from '../types';
import { ArrowLeft, PlayCircle, ExternalLink, Play } from 'lucide-react';

const Album: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        // Fetch Album Info
        const { album, tracks } = await getAlbumDetails(id);
        setAlbum(album);
        setTracks(tracks);

        // Fetch User Ratings for this album
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const userRatings = await getAlbumRatings(user.id, id);
            const ratingMap: Record<string, number> = {};
            userRatings.forEach(r => {
              ratingMap[r.song_id] = r.rating;
            });
            setRatings(ratingMap);
          } catch (ratingErr) {
            console.warn("Could not fetch ratings", ratingErr);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleRate = async (track: SpotifyTrack, ratingValue: number) => {
    if (!album) return;
    // Optimistic Update
    setRatings(prev => ({ ...prev, [track.id]: ratingValue }));
    setSaving(track.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Save Rating (using ratings table)
      await upsertRating({
        song_id: track.id,
        album_id: album.id,
        // Note: we can't send names to the DB as per schema restriction, 
        // but we keep them in logic if we need them later or if schema changes back
        rating: ratingValue,
        song_name: track.name,
        album_name: album.name,
        artist_name: album.artists[0].name,
        artist_id: album.artists[0].id, // VITAL: Save Artist ID for collection
        genre: '', 
        album_art_url: album.images[0]?.url // Save cover art
      });

      // 2. Check and Unlock Achievements
      // We pass the total tracks of the album to check for 'Album Master'
      await checkAchievements(user.id, ratingValue, album.id, tracks.length);

    } catch (error) {
      console.error("Error saving rating", error);
    } finally {
      setSaving(null);
    }
  };

  const openYouTubeMusic = () => {
    if (!album) return;
    const query = encodeURIComponent(`${album.artists[0].name} ${album.name}`);
    window.open(`https://music.youtube.com/search?q=${query}`, '_blank');
  };

  if (loading) return <div className="p-8 text-center dark:text-white">Loading album...</div>;
  if (!album) return <div className="p-8 text-center dark:text-white">Album not found</div>;

  return (
    <div className="pb-24 bg-gray-50 dark:bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-700 px-4 py-3 flex items-center shadow-sm">
        <Link to={`/artist/${album.artists[0].id}`} className="mr-4 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-bold text-lg text-gray-900 dark:text-white truncate flex-1">{album.name}</h1>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Album Info */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <img 
            src={album.images[0]?.url} 
            alt={album.name} 
            className="w-48 h-48 rounded-xl shadow-lg mx-auto sm:mx-0"
          />
          <div className="text-center sm:text-left pt-2 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{album.name}</h2>
            <Link to={`/artist/${album.artists[0].id}`} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {album.artists.map(a => a.name).join(', ')}
            </Link>
            <p className="text-gray-500 text-sm mt-2 mb-4">
              {album.total_tracks} tracks • {album.release_date.substring(0, 4)}
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center sm:justify-start space-x-3">
              <button 
                onClick={openYouTubeMusic}
                className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Music size={16} className="mr-2 text-brand-500" />
                YouTube Music
              </button>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        <div className="space-y-2">
          {tracks.map((track) => {
             const currentScore = ratings[track.id] || 0;
             return (
               <div key={track.id} className="bg-white dark:bg-dark-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-dark-700 transition-colors">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h3 className="font-medium text-sm text-gray-900 dark:text-white leading-tight">{track.name}</h3>
                     <div className="flex items-center text-[10px] text-gray-500 mt-1">
                       <span className="bg-gray-100 dark:bg-dark-700 px-1 py-0.5 rounded mr-2 opacity-80">{track.track_number}</span>
                       {Math.floor(track.duration_ms / 60000)}:{(Math.floor((track.duration_ms % 60000) / 1000)).toString().padStart(2, '0')}
                     </div>
                   </div>
                   {track.preview_url && (
                     <a 
                        href={track.preview_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-brand-500 hover:text-brand-600"
                        title="Listen to preview"
                     >
                       <Play size={18} fill="currentColor" />
                     </a>
                   )}
                 </div>
                 
                 {/* Rating UI - Compact Bar */}
                 <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-dark-700 mt-1">
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mr-3 w-6">Rate</span>
                   <div className="flex-1 flex gap-[2px]">
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                       <button
                         key={score}
                         onClick={() => handleRate(track, score)}
                         className={`flex-1 h-6 rounded-[3px] flex items-center justify-center text-[9px] font-bold transition-all ${
                           currentScore >= score
                             ? 'bg-brand-500 text-white shadow-sm'
                             : 'bg-gray-100 dark:bg-dark-700 text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-dark-600'
                         }`}
                       >
                         {score}
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper icon for the button
const Music = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
);

export default Album;
