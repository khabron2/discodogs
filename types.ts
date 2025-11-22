
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
  popularity: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: SpotifyImage[];
  album_type: 'album' | 'single' | 'compilation';
  artists: { name: string; id: string }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  popularity?: number;
  preview_url?: string | null;
  artists: { name: string; id: string }[];
  album?: { images: SpotifyImage[]; name: string };
}

export interface UserRating {
  id?: string;
  user_id: string;
  song_id: string;
  album_id: string;
  rating: number; // Renamed from score to match DB
  
  // Metadata might be returned by view or joins, keeping optional
  song_name?: string;
  album_name?: string;
  artist_name?: string;
  artist_id?: string; // New field to link back to artist page
  genre?: string;
  album_art_url?: string; // New field for cover art
  created_at?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at?: string | null;
}
