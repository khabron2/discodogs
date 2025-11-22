
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { UserRating } from '../types';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to ensure user exists in public.users table (required for Foreign Keys)
const ensureUserExists = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to find the user in public.users
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!data) {
    // If not found, insert them (using the Auth ID)
    // We use upsert just in case of race conditions
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email
    }, { onConflict: 'id' });
  }
  return user;
};

// --- SONG RATINGS (Via 'ratings' View) ---

export const upsertRating = async (rating: Omit<UserRating, 'id' | 'created_at' | 'user_id'>) => {
  const user = await ensureUserExists();
  if (!user) throw new Error("User not logged in");

  // We can simply INSERT into the 'ratings' view.
  // The database trigger `trg_ratings_upsert` handles the logic:
  // IF exists -> UPDATE, IF not -> INSERT.
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      user_id: user.id,
      song_id: rating.song_id,
      album_id: rating.album_id,
      rating: rating.rating,
      // Metadata columns (must be created in DB first via SQL)
      song_name: rating.song_name,
      album_name: rating.album_name,
      artist_name: rating.artist_name,
      artist_id: rating.artist_id, // Saving Artist ID for collection links
      genre: rating.genre,
      album_art_url: rating.album_art_url // New field
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase song rating save error:", JSON.stringify(error));
    throw new Error(error.message || "Database error during save");
  }
  return data;
};

export const getUserRatings = async (userId: string) => {
  // Fetch from 'ratings' view
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error("Supabase get ratings error:", JSON.stringify(error));
    throw new Error(error.message || "Database error fetching ratings");
  }
  return data as UserRating[];
};

// Fetch unique Artists and Albums for the Collection page
export const getUserCollection = async (userId: string) => {
  const ratings = await getUserRatings(userId);
  
  // Deduplicate Artists
  const uniqueArtistsMap = new Map();
  const uniqueAlbumsMap = new Map();

  ratings.forEach(r => {
    if (r.artist_id && r.artist_name) {
      if (!uniqueArtistsMap.has(r.artist_id)) {
        uniqueArtistsMap.set(r.artist_id, {
          id: r.artist_id,
          name: r.artist_name,
          image: r.album_art_url // Use album art as proxy for artist image
        });
      }
    }

    if (r.album_id && r.album_name) {
      if (!uniqueAlbumsMap.has(r.album_id)) {
        uniqueAlbumsMap.set(r.album_id, {
          id: r.album_id,
          name: r.album_name,
          artist: r.artist_name,
          image: r.album_art_url
        });
      }
    }
  });

  return {
    artists: Array.from(uniqueArtistsMap.values()),
    albums: Array.from(uniqueAlbumsMap.values())
  };
};

export const getAlbumRatings = async (userId: string, albumId: string) => {
  // Fetch song ratings for a specific album from 'ratings' view
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('user_id', userId)
    .eq('album_id', albumId);
    
  if (error) {
    console.error("Supabase get album song ratings error:", JSON.stringify(error));
    throw new Error(error.message || "Database error fetching album ratings");
  }

  return data as UserRating[];
};

// --- ALBUM RATINGS (Via 'album_ratings' Table) ---

export const upsertAlbumRating = async (albumId: string, rating: number) => {
  const user = await ensureUserExists();
  if (!user) throw new Error("User not logged in");

  // The 'album_ratings' table has a UNIQUE(user_id, album_id) constraint.
  // We can use Supabase's native upsert.
  const { data, error } = await supabase
    .from('album_ratings')
    .upsert({ 
      user_id: user.id, 
      album_id: albumId, 
      rating,
      // created_at defaults to NOW()
      // updated_at handled by trigger
    }, { onConflict: 'user_id, album_id' })
    .select()
    .single();

  if (error) {
    console.error("Supabase album rating save error:", JSON.stringify(error));
    throw new Error(error.message);
  }
  return data;
};

// --- ACHIEVEMENTS ---

export const unlockAchievement = async (achievementId: string) => {
  const user = await ensureUserExists();
  if (!user) return;

  // The user_achievements table links users to achievements
  // Check if already unlocked
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', user.id)
    .eq('achievement_id', achievementId)
    .maybeSingle();

  if (existing) return;

  // Unlock
  const { error: insertError } = await supabase.from('user_achievements').insert({
    user_id: user.id,
    achievement_id: achievementId,
    unlocked_at: new Date().toISOString()
  });

  if (insertError) {
    console.error("Error unlocking achievement:", JSON.stringify(insertError));
  }
};

export const getUserAchievements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error("Supabase get achievements error:", JSON.stringify(error));
    // Don't throw here to avoid blocking the UI if achievements table is missing
    return [];
  }
  return data;
};

// Logic to verify and unlock achievements based on activity
export const checkAchievements = async (userId: string, currentRating: number, albumId: string, totalTracksInAlbum: number) => {
  try {
    // 1. Instant Checks
    if (currentRating === 10) {
      await unlockAchievement('top_rater');
    }

    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      await unlockAchievement('night_owl');
    }

    // 2. Database Checks (Counts)
    
    // Get count of ratings for this specific album to check 'Album Master'
    const { count: albumRatingCount, error: albumError } = await supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('album_id', albumId);

    if (!albumError && albumRatingCount === totalTracksInAlbum) {
      await unlockAchievement('album_master');
    }

    // Get total ratings count for 'First Listen' and 'Pro Critic'
    const { count: totalCount, error: totalError } = await supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!totalError && totalCount) {
      if (totalCount >= 1) {
        await unlockAchievement('first_listen');
      }
      if (totalCount >= 50) {
        await unlockAchievement('critic');
      }
    }

  } catch (e) {
    console.error("Error checking achievements:", e);
  }
};
