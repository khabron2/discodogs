
// Spotify Credentials
// NOTE: In a production app, Client Secret should NEVER be stored in the frontend code.
// It should be handled by a secure backend proxy. 
// Included here strictly for the requested functional demo requirements.
export const SPOTIFY_CLIENT_ID = 'f3fe603229494a348d06a63ebf321927';
export const SPOTIFY_CLIENT_SECRET = '49baa39c44414c02ab37bb831a87e013';

// Supabase Credentials
export const SUPABASE_URL = 'https://iprxnukfjbdvdaqlyvbs.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcnhudWtmamJkdmRhcWx5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzYxNTIsImV4cCI6MjA3OTMxMjE1Mn0.T9mtj1FvcWx6j1-y2UF_Q83FJLRcb2B6ColYJXz61FI';

// Achievements List (Frontend Mirror of DB Catalog)
export const ACHIEVEMENTS_LIST = [
  { id: 'first_listen', title: 'First Note', description: 'Rate your first song', icon: 'music' },
  { id: 'album_master', title: 'First Disco', description: 'Complete an entire album', icon: 'disc' },
  { id: 'critic', title: 'Pro Critic', description: 'Rate 50 songs', icon: 'pen-tool' },
  { id: 'top_rater', title: 'Top Rater', description: 'Give a 10/10 rating', icon: 'star' },
  { id: 'night_owl', title: 'Musical Night', description: 'Rate a song after midnight', icon: 'moon' },
  { id: 'marathon', title: 'Discography Finished', description: 'Rate all albums by one artist', icon: 'award' },
];

// SQL Setup Script for error handling UI
export const SQL_SETUP_SCRIPT = `
-- ==============================
-- 0. Limpieza TOTAL
-- ==============================
DROP VIEW IF EXISTS ratings CASCADE;
DROP FUNCTION IF EXISTS ratings_upsert CASCADE;
DROP TABLE IF EXISTS song_ratings CASCADE;
DROP TABLE IF EXISTS album_ratings CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================
-- 1. Users
-- ==============================
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================
-- 2. Album Ratings
-- ==============================
CREATE TABLE album_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    album_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, album_id)
);

-- ==============================
-- 3. Song Ratings (CON ARTIST_ID)
-- ==============================
CREATE TABLE song_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL,
    album_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    
    -- Metadatos
    song_name TEXT,
    album_name TEXT,
    artist_name TEXT,
    artist_id TEXT, -- VITAL PARA LA COLECCION
    genre TEXT,
    album_art_url TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, song_id)
);

-- ==============================
-- 4. Achievements
-- ==============================
CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ==============================
-- 5. Triggers
-- ==============================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_album_ratings BEFORE UPDATE ON album_ratings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_song_ratings BEFORE UPDATE ON song_ratings FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ==============================
-- 6. Vista Ratings
-- ==============================
CREATE OR REPLACE VIEW ratings AS
SELECT
    sr.id,
    sr.user_id,
    sr.song_id,
    sr.album_id,
    sr.rating,
    sr.song_name,
    sr.album_name,
    sr.artist_name,
    sr.artist_id, -- INCLUIDO
    sr.genre,
    sr.album_art_url,
    sr.created_at,
    sr.updated_at
FROM song_ratings sr;

-- ==============================
-- 7. Trigger Upsert
-- ==============================
CREATE OR REPLACE FUNCTION ratings_upsert()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO song_ratings(
            user_id, song_id, album_id, rating, 
            song_name, album_name, artist_name, artist_id, genre, album_art_url
        )
        VALUES (
            NEW.user_id, NEW.song_id, NEW.album_id, NEW.rating, 
            NEW.song_name, NEW.album_name, NEW.artist_name, NEW.artist_id, NEW.genre, NEW.album_art_url
        )
        ON CONFLICT (user_id, song_id)
        DO UPDATE SET 
            rating = EXCLUDED.rating,
            song_name = EXCLUDED.song_name,
            album_name = EXCLUDED.album_name,
            artist_name = EXCLUDED.artist_name,
            artist_id = EXCLUDED.artist_id,
            album_art_url = EXCLUDED.album_art_url,
            updated_at = NOW();
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE song_ratings
        SET rating = NEW.rating,
            song_name = NEW.song_name,
            album_name = NEW.album_name,
            artist_name = NEW.artist_name,
            artist_id = NEW.artist_id,
            genre = NEW.genre,
            album_art_url = NEW.album_art_url,
            updated_at = NOW()
        WHERE user_id = NEW.user_id AND song_id = NEW.song_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ratings_upsert
INSTEAD OF INSERT OR UPDATE ON ratings
FOR EACH ROW EXECUTE PROCEDURE ratings_upsert();

-- ==============================
-- 8. RLS
-- ==============================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users all own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users all own song_ratings" ON song_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users all own album_ratings" ON album_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users all own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);

-- ==============================
-- 9. Seed
-- ==============================
INSERT INTO achievements (id, name, description, icon) VALUES
('first_listen', 'First Note', 'Rate your first song', 'music'),
('album_master', 'First Disco', 'Complete an entire album', 'disc'),
('critic', 'Pro Critic', 'Rate 50 songs', 'pen-tool'),
('top_rater', 'Top Rater', 'Give a 10/10 rating', 'star'),
('night_owl', 'Musical Night', 'Rate a song after midnight', 'moon'),
('marathon', 'Discography Finished', 'Rate all albums by one artist', 'award')
ON CONFLICT (id) DO NOTHING;
`;
