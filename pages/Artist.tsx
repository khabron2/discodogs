import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArtist, getArtistAlbums } from '../services/spotifyService';
import { SpotifyArtist, SpotifyAlbum } from '../types';
import { ArrowLeft, Disc } from 'lucide-react';

const Artist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [artistData, albumData] = await Promise.all([
          getArtist(id),
          getArtistAlbums(id)
        ]);
        setArtist(artistData);
        setAlbums(albumData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center dark:text-white">Loading discography...</div>;
  if (!artist) return <div className="p-8 text-center dark:text-white">Artist not found</div>;

  return (
    <div className="pb-24 bg-gray-50 dark:bg-dark-900 min-h-screen">
      {/* Hero Header */}
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
        <img 
          src={artist.images[0]?.url} 
          alt={artist.name} 
          className="w-full h-full object-cover"
        />
        <Link to="/search" className="absolute top-6 left-6 z-20 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
          <ArrowLeft size={20} />
        </Link>
        <div className="absolute bottom-6 left-6 z-20 text-white">
          <h1 className="text-3xl font-bold">{artist.name}</h1>
          <p className="text-gray-300 text-sm mt-1 capitalize">{artist.genres.join(', ')}</p>
        </div>
      </div>

      {/* Discography */}
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Disc className="mr-2 text-brand-500" size={20} />
          Discography
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {albums.map(album => (
            <Link to={`/album/${album.id}`} key={album.id} className="group">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-dark-700 h-full transition-transform hover:-translate-y-1">
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-200">
                  <img 
                    src={album.images[0]?.url} 
                    alt={album.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 mb-1">
                  {album.name}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{album.release_date.substring(0, 4)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-gray-500 uppercase">
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