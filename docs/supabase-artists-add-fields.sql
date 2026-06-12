-- Optional: add location and social_links to artists (run after supabase-artists-table.sql)
-- Run in Supabase Dashboard → SQL Editor
--
-- Required for artist profile "Configuración" tab: Ubicación and Enlaces Sociales
-- are saved to artists.location and artists.social_links. Without this migration,
-- only Nombre artístico and Biografía persist (artist_name, bio).

alter table public.artists
  add column if not exists location text,
  add column if not exists social_links jsonb default '{}';

comment on column public.artists.social_links is 'Optional: { "youtube": "", "soundcloud": "", "bandcamp": "", "instagram": "", "website": "" }';
