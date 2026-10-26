-- Teams get a second logo for dark backgrounds (some primary logos are dark
-- and disappear on a dark screen). The app picks one per light/dark mode.
alter table public.teams add column logo_dark_url text;
