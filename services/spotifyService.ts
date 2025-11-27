
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants';
import { SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '../types';

// --- APP LEVEL AUTH (Client Credentials) ---
// Used for searching, fetching album details, etc. (Public Data)
let appAccessToken: string | null = null;
let appTokenExpirationTime: number = 0;

const getAppAccessToken = async (): Promise<string> => {
  const now = Date.now();
  if (appAccessToken && now < appTokenExpirationTime) {
    return appAccessToken;
  }

  const authString = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify token');
    }

    const data = await response.json();
    appAccessToken = data.access_token;
    // Expire 60 seconds before actual expiration to be safe
    appTokenExpirationTime = now + (data.expires_in * 1000) - 60000;
    
    return appAccessToken as string;
  } catch (error) {
    console.error('Spotify Auth Error:', error);
    throw error;
  }
};

const fetchSpotifyApp = async (endpoint: string) => {
  const token = await getAppAccessToken();
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      appAccessToken = null;
      const newToken = await getAppAccessToken();
      const retryResponse = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      return retryResponse.json();
    }
    throw new Error(`Spotify API error: ${response.statusText}`);
  }
  return response.json();
};

// --- USER LEVEL AUTH (Implicit Grant / PKCE) ---
// Used for "Now Playing" and User Profile specific data

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state'
];

export const authorizeSpotifyUser = () => {
  // Normalize redirect URI: Remove trailing slash if present to ensure exact match with Dashboard
  let redirectUri = window.location.origin;
  if (redirectUri.endsWith('/')) {
    redirectUri = redirectUri.slice(0, -1);
  }

  console.log("Redirecting to Spotify with URI:", redirectUri);
  console.log("IMPORTANT: This URI must be added to 'Redirect URIs' in Spotify Developer Dashboard");

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'token'); // Implicit grant for simplicity in this demo
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('show_dialog', 'true');

  window.location.href = authUrl.toString();
};

export const getNowPlaying = async (userToken: string) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (response.status === 204 || response.status > 400) {
      return null; // Not playing or error
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return null;
  }
};

// --- PUBLIC API EXPORTS ---

export const searchArtists = async (query: string): Promise<SpotifyArtist[]> => {
  if (!query) return [];
  const data = await fetchSpotifyApp(`/search?q=${encodeURIComponent(query)}&type=artist&limit=10`);
  return data.artists.items;
};

export const getArtist = async (id: string): Promise<SpotifyArtist> => {
  return fetchSpotifyApp(`/artists/${id}`);
};

export const getArtistTopTracks = async (artistId: string): Promise<SpotifyTrack[]> => {
  // Market 'US' is standard for generic popularity
  const data = await fetchSpotifyApp(`/artists/${artistId}/top-tracks?market=US`);
  return data.tracks.slice(0, 5);
};

export const getArtistAlbums = async (artistId: string): Promise<SpotifyAlbum[]> => {
  let allAlbums: SpotifyAlbum[] = [];
  const data = await fetchSpotifyApp(`/artists/${artistId}/albums?include_groups=album,single&limit=50`);
  allAlbums = data.items;
  
  const uniqueAlbums = Array.from(new Map(allAlbums.map(item => [item.name, item])).values());
  
  return uniqueAlbums.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
};

export const getAlbumDetails = async (albumId: string): Promise<{ album: SpotifyAlbum; tracks: SpotifyTrack[] }> => {
  const album = await fetchSpotifyApp(`/albums/${albumId}`);
  const tracks = album.tracks.items.map((t: any) => ({...t, album: { images: album.images, name: album.name }}));
  return { album, tracks };
};

export const getTrackDetails = async (trackId: string): Promise<SpotifyTrack> => {
  return fetchSpotifyApp(`/tracks/${trackId}`);
};
