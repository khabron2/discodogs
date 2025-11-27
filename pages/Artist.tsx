
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArtist, getArtistAlbums, getArtistTopTracks } from '../services/spotifyService';
import { getArtistTopRated, supabase } from '../services/supabaseService';
import { SpotifyArtist, SpotifyAlbum, SpotifyTrack } from '../types';
import { ArrowLeft, Disc, ExternalLink, TrendingUp, Play, Star } from 'lucide-react';

// Extended type to handle mixed data (Spotify API vs Local DB)
interface DisplayTrack extends Partial<SpotifyTrack> {
  userRating?: number;
  albumImage?: string;
  albumName?: string;
}

const Artist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [topTracks, setTopTracks] = useState<DisplayTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserStats, setIsUserStats] = useState(false);
  const [musicPref, setMusicPref] = useState('spotify');

  useEffect(() => {
    // Check music preference
    const pref = localStorage.getItem('music_preference') || 'spotify';
    setMusicPref(pref);

    if (!id) return;
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Parallel fetch for static data
        const [artistData, albumData] = await Promise.all([
          getArtist(id),
          getArtistAlbums(id)
        ]);
        
        setArtist(artistData);
        setAlbums(albumData);

        // LOGIC: Top Tracks based on User Scores first
        let tracksToDisplay: DisplayTrack[] = [];
        let usingUserStats = false;

        if (user) {
          const userTopRated = await getArtistTopRated(user.id, id);
          if (userTopRated && userTopRated.length > 0) {
            usingUserStats = true;
            tracksToDisplay = userTopRated.map(r => ({
              id: r.song_id,
              name: r.song_name,
              userRating: r.rating,
              album: { id: r.album_id, name: r.album_name || '', images: [] } as any,
              albumImage: r.album_art_url,
              albumName: r.album_name
            }));
          }
        }

        // Fallback: If no user ratings, use Spotify Popular tracks
        if (!usingUserStats) {
          const spotifyTop = await getArtistTopTracks(id);
          tracksToDisplay = spotifyTop.map(t => ({
             ...t,
             albumImage: t.album?.images[2]?.url || t.album?.images[0]?.url,
             albumName: t.album?.name
          }));
        }

        setTopTracks(tracksToDisplay);
        setIsUserStats(usingUserStats);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleHeaderAction = () => {
    if (!artist) return;
    if (musicPref === 'ytmusic') {
      const query = encodeURIComponent(artist.name);
      window.open(`https://music.youtube.com/search?q=${query}`, '_blank');
    } else {
      // Default to opening artist in Spotify web/app or just do nothing/log
      window.open(`https://open.spotify.com/artist/${artist.id}`, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center dark:text-white">Loading discography...</div>;
  if (!artist) return <div className="p-8 text-center dark:text-white">Artist not found</div>;

  return (
    <div className="pb-24 bg-gray-50 dark:bg-dark-900 min-h-screen">
      {/* Hero Header */}
      <div className="relative h-72 w-full overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent z-10" />
        <img 
          src={artist.images[0]?.url} 
          alt={artist.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <Link to="/search" className="absolute top-6 left-6 z-20 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition">
          <ArrowLeft size={20} />
        </Link>
        
        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
          <div className="text-white">
            <h1 className="text-4xl font-bold tracking-tight">{artist.name}</h1>
            <p className="text-gray-300 text-sm mt-2 capitalize font-medium opacity-90">{artist.genres.slice(0, 3).join(' • ')}</p>
          </div>
          
          {/* Action Shortcut */}
          <button 
            onClick={handleHeaderAction}
            className={`p-2.5 rounded-full backdrop-blur-sm shadow-lg transition-all hover:scale-105 text-white ${
              musicPref === 'ytmusic' ? 'bg-red-600/90 hover:bg-red-600' : 'bg-brand-500/90 hover:bg-brand-500'
            }`}
            title={musicPref === 'ytmusic' ? "Listen on YouTube Music" : "Listen on Spotify"}
          >
            {musicPref === 'ytmusic' ? <Play size={20} fill="currentColor" /> : <ExternalLink size={20} />}
          </button>
        </div>
      </div>

      {/* Top Tracks Section */}
      <div className="p-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
          <div className="flex items-center">
            {isUserStats ? (
              <Star className="mr-2 text-brand-500" size={20} fill="currentColor" />
            ) : (
              <TrendingUp className="mr-2 text-brand-500" size={20} />
            )}
            {isUserStats ? "Your Top Rated" : "Popular on Spotify"}
          </div>
          {isUserStats && (
            <span className="text-[10px] uppercase bg-brand-900/30 text-brand-400 px-2 py-1 rounded font-bold">
              Based on your scores
            </span>
          )}
        </h2>
        
        <div className="space-y-2 mb-8">
          {topTracks.map((track, index) => (
            <Link 
              to={`/album/${track.album?.id}`} 
              key={track.id || index}
              className="flex items-center p-2 rounded-lg hover:bg-white dark:hover:bg-dark-800 transition-colors group"
            >
              {/* If User Stats, show Score. If Spotify, show Index */}
              <div className="w-8 text-center flex-shrink-0 flex justify-center">
                {isUserStats && track.userRating ? (
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${
                    track.userRating >= 9 ? 'bg-brand-500' : 
                    track.userRating >= 7 ? 'bg-brand-600' : 'bg-gray-500'
                  }`}>
                    {track.userRating}
                  </div>
                ) : (
                  <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                )}
              </div>

              <img 
                src={track.albumImage || 'https://via.placeholder.com/40'} 
                alt={track.albumName}
                className="w-10 h-10 rounded-md object-cover mr-3 flex-shrink-0 bg-gray-200"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                  {track.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {track.albumName}
                </p>
              </div>
              
              {track.duration_ms && (
                 <div className="text-xs text-gray-400 ml-2">
                   {Math.floor(track.duration_ms / 60000)}:{(Math.floor((track.duration_ms % 60000) / 1000)).toString().padStart(2, '0')}
                 </div>
              )}
            </Link>
          ))}
          
          {topTracks.length === 0 && (
             <div className="text-gray-500 text-sm italic p-2">No tracks available.</div>
          )}
        </div>
      </div>

      {/* Discography */}
      <div className="px-6 pb-6 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Disc className="mr-2 text-brand-500" size={20} />
          Discography
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {albums.map(album => (
            <Link to={`/album/${album.id}`} key={album.id} className="group">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-dark-700 h-full transition-transform hover:-translate-y-1">
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-200 relative">
                  <img 
                    src={album.images[0]?.url} 
                    alt={album.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 mb-1">
                  {album.name}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{album.release_date.substring(0, 4)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-gray-500 uppercase tracking-wide">
                    {album.album_type}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Artist;
