import React, { useState, useEffect, useCallback } from 'react';
import { searchArtists } from '../services/spotifyService';
import { SpotifyArtist } from '../types';
import { Search as SearchIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyArtist[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce logic manually implemented to avoid extra deps
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        try {
          const artists = await searchArtists(query);
          setResults(artists);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Find Artists</h1>
      
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search for a band or artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none dark:text-white transition-all"
          autoFocus
        />
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="text-center py-4 text-gray-500 text-sm">Searching Spotify...</div>
        )}
        
        {!loading && results.length === 0 && query.length > 2 && (
           <div className="text-center py-4 text-gray-500 text-sm">No artists found.</div>
        )}

        {results.map((artist) => (
          <Link to={`/artist/${artist.id}`} key={artist.id}>
            <div className="group flex items-center p-3 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm hover:shadow-md">
              <img 
                src={artist.images[0]?.url || 'https://picsum.photos/100/100'} 
                alt={artist.name} 
                className="w-16 h-16 rounded-lg object-cover bg-gray-200"
              />
              <div className="ml-4 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{artist.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {artist.genres.slice(0, 2).join(', ')}
                </p>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-brand-500" size={20} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Search;