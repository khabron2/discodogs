
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserCollection, supabase } from '../services/supabaseService';
import { Disc, Mic2, ChevronRight } from 'lucide-react';

interface CollectionItem {
  id: string;
  name: string;
  image?: string;
  artist?: string;
}

const Collection: React.FC = () => {
  const [artists, setArtists] = useState<CollectionItem[]>([]);
  const [albums, setAlbums] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'artists' | 'albums'>('artists');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const collection = await getUserCollection(user.id);
          setArtists(collection.artists);
          setAlbums(collection.albums);
        } catch (e) {
          console.error("Error loading collection:", e);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center dark:text-white">Loading your library...</div>;
  }

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">My Collection</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Your musical journey so far.
      </p>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-dark-800 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab('artists')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === 'artists'
              ? 'bg-white dark:bg-dark-700 text-brand-600 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Artists
        </button>
        <button
          onClick={() => setTab('albums')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === 'albums'
              ? 'bg-white dark:bg-dark-700 text-brand-600 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Albums
        </button>
      </div>

      {/* Content */}
      {tab === 'artists' ? (
        <div className="space-y-3">
          {artists.length === 0 ? (
             <div className="text-center py-12 border border-dashed border-gray-300 dark:border-dark-600 rounded-xl">
               <Mic2 className="mx-auto text-gray-400 mb-3" size={32} />
               <p className="text-gray-500">No artists saved yet.</p>
             </div>
          ) : (
            artists.map((artist) => (
              <Link to={`/artist/${artist.id}`} key={artist.id}>
                <div className="flex items-center p-3 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm hover:border-brand-500 dark:hover:border-brand-500 transition-colors group">
                  <img 
                    src={artist.image || 'https://via.placeholder.com/150'} 
                    alt={artist.name} 
                    className="w-14 h-14 rounded-full object-cover bg-gray-200"
                  />
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{artist.name}</h3>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-brand-500" size={20} />
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {albums.length === 0 ? (
             <div className="col-span-2 text-center py-12 border border-dashed border-gray-300 dark:border-dark-600 rounded-xl">
               <Disc className="mx-auto text-gray-400 mb-3" size={32} />
               <p className="text-gray-500">No albums rated yet.</p>
             </div>
          ) : (
            albums.map((album) => (
              <Link to={`/album/${album.id}`} key={album.id} className="group">
                <div className="bg-white dark:bg-dark-800 p-3 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm h-full transition-transform hover:-translate-y-1">
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-200 relative">
                    <img 
                      src={album.image || 'https://via.placeholder.com/150'} 
                      alt={album.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-1">
                    {album.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{album.artist}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Collection;
