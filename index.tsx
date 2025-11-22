
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/*
  --- SUPABASE DATABASE SCHEMA SETUP ---
  To make this app work fully, run the following SQL in your Supabase SQL Editor:

  -- 1. Create Ratings Table
  create table public.ratings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    song_id text not null,
    album_id text not null,
    rating integer not null check (rating >= 1 and rating <= 10),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, song_id)
  );

  -- 2. Create Achievements Table
  create table public.user_achievements (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    achievement_id text not null,
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, achievement_id)
  );

  -- 3. Enable RLS (Row Level Security)
  alter table public.ratings enable row level security;
  alter table public.user_achievements enable row level security;

  -- 4. Policies
  create policy "Users can select their own ratings" on public.ratings for select using (auth.uid() = user_id);
  create policy "Users can insert their own ratings" on public.ratings for insert with check (auth.uid() = user_id);
  create policy "Users can update their own ratings" on public.ratings for update using (auth.uid() = user_id);

  create policy "Users can view achievements" on public.user_achievements for select using (auth.uid() = user_id);
  create policy "Users can insert achievements" on public.user_achievements for insert with check (auth.uid() = user_id);
*/

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
