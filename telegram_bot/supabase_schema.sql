-- =====================================================================
-- StudyMate Sarkari - Supabase Database Schema
-- Run this in your Supabase Dashboard -> SQL Editor
-- =====================================================================

-- 1. Create sarkari_notifications table (for storing scraped alerts)
CREATE TABLE IF NOT EXISTS public.sarkari_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT,
    category TEXT DEFAULT 'Jobs',
    state TEXT DEFAULT 'All India',
    url TEXT,
    vacancies TEXT,
    last_date TEXT,
    source_site TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast category and state filtering
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.sarkari_notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_state ON public.sarkari_notifications(state);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.sarkari_notifications(created_at DESC);

-- 2. Create custom government scraping sources table
CREATE TABLE IF NOT EXISTS public.government_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    notices_url TEXT,
    type TEXT DEFAULT 'Central Commission',
    state TEXT DEFAULT 'All India',
    category TEXT DEFAULT 'All',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.sarkari_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_sources ENABLE ROW LEVEL SECURITY;

-- Allow public read access so your website can display all items without authentication
CREATE POLICY "Allow Public Read Access on Notifications" 
ON public.sarkari_notifications FOR SELECT USING (true);

CREATE POLICY "Allow Public Read Access on Sources" 
ON public.government_sources FOR SELECT USING (true);

-- Allow Insert/Update from your bot (using anon or service_role key)
CREATE POLICY "Allow Insert for All" 
ON public.sarkari_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow Insert for Sources" 
ON public.government_sources FOR INSERT WITH CHECK (true);

-- 4. Enable Supabase Realtime so website updates automatically whenever bot posts new items
ALTER PUBLICATION supabase_realtime ADD TABLE public.sarkari_notifications;
