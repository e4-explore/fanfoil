-- =============================================================================
-- Core schema: sports catalog, collectible inventory, accounts, offers, claims.
--
-- Design rules
--   * The inventory (public.collectibles) is the source of truth for supply.
--     Rarity = edition size. remaining = total_supply - claimed_count.
--   * Clients never write inventory, offers or claims directly. Every write
--     goes through a SECURITY DEFINER function (see 20261025000002_claim_logic.sql)
--     so supply checks and serial numbers are atomic and can't be faked.
--   * Columns marked "reserved" exist so packs, NFTs and notifications can be
--     added later without reshaping existing data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Catalog: sport -> league -> team
-- ---------------------------------------------------------------------------
create table public.sports (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.leagues (
  id          uuid primary key default gen_random_uuid(),
  sport_id    uuid not null references public.sports (id),
  slug        text not null unique,
  name        text not null,
  short_name  text not null,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index leagues_sport_idx on public.leagues (sport_id);

create table public.teams (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid not null references public.leagues (id),
  slug          text not null,
  name          text not null,          -- "Indiana Pacers"
  location      text not null,          -- "Indiana"
  nickname      text not null,          -- "Pacers"
  abbreviation  text not null,          -- "IND"
  conference    text,                   -- grouping for pickers; league-specific
  logo_url      text,                   -- intentionally empty; see README (trademarks)
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (league_id, slug)
);
create index teams_league_idx on public.teams (league_id);

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
-- Tiers are data, not an enum, so new levels (e.g. "moment", "legendary")
-- can be added with an INSERT instead of a migration.
create table public.collectible_tiers (
  slug            text primary key,
  name            text not null,
  description     text,
  rarity_rank     int not null unique,  -- 1 = most common
  default_supply  int not null check (default_supply > 0)
);

create table public.collectibles (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  tier           text not null references public.collectible_tiers (slug),
  name           text not null,                 -- "Floor General"
  subtitle       text,                          -- "Runs the offense"
  description    text,
  league_id      uuid not null references public.leagues (id),
  team_id        uuid references public.teams (id),  -- null = league-wide collectible
  season         text,                          -- "2026-27"
  total_supply   int not null check (total_supply > 0),
  claimed_count  int not null default 0,
  art            jsonb not null default '{}'::jsonb,  -- render hints: glyph, pattern
  attributes     jsonb not null default '{}'::jsonb,  -- archetype, roles in a storyline, etc.
  -- reserved: NFT collection this card mints into (token ids live on each claim)
  nft_chain             text,
  nft_contract_address  text,
  is_active      boolean not null default true,
  released_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  constraint collectibles_supply_ok check (claimed_count >= 0 and claimed_count <= total_supply)
);
create index collectibles_team_idx   on public.collectibles (team_id) where is_active;
create index collectibles_league_idx on public.collectibles (league_id) where is_active;

-- How much each tier is weighted when building an offer, per source.
-- A multiplier of 0 removes the tier from that source entirely.
create table public.offer_rules (
  source             text not null,
  tier               text not null references public.collectible_tiers (slug),
  weight_multiplier  numeric not null default 1 check (weight_multiplier >= 0),
  primary key (source, tier)
);

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  display_name           text,
  followed_team_id       uuid references public.teams (id),
  onboarding_claimed_at  timestamptz,   -- set once; switching teams never resets it
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- History of which team a user followed and when (useful for analytics and
-- for season-long features later).
create table public.team_follows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  team_id     uuid not null references public.teams (id),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create index team_follows_user_idx on public.team_follows (user_id);
create unique index team_follows_one_current on public.team_follows (user_id) where ended_at is null;

-- ---------------------------------------------------------------------------
-- Offers and claims
-- ---------------------------------------------------------------------------
-- An offer is the server-side record of "these 3 cards were shown to this
-- user". Users can only claim a card that is in an open offer made for them,
-- so they can't pick arbitrary cards or reroll by refreshing.
create table public.claim_offers (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  source                 text not null check (source in ('onboarding', 'matchday', 'pack', 'promo')),
  team_id                uuid references public.teams (id),
  options                uuid[] not null,
  status                 text not null default 'open' check (status in ('open', 'claimed', 'void', 'expired')),
  chosen_collectible_id  uuid references public.collectibles (id),
  created_at             timestamptz not null default now(),
  resolved_at            timestamptz,
  expires_at             timestamptz
);
create index claim_offers_user_idx on public.claim_offers (user_id);
create unique index claim_offers_one_open_per_source on public.claim_offers (user_id, source) where status = 'open';

create table public.user_collectibles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  collectible_id  uuid not null references public.collectibles (id),
  serial_number   int not null check (serial_number > 0),   -- "#37 of 1000"
  offer_id        uuid references public.claim_offers (id),
  source          text not null,
  claimed_at      timestamptz not null default now(),
  -- reserved: filled in when this copy is minted on-chain
  nft_token_id    text,
  nft_minted_at   timestamptz,
  unique (collectible_id, serial_number)
);
create index user_collectibles_user_idx on public.user_collectibles (user_id);

-- ---------------------------------------------------------------------------
-- Read model for the inventory screen
-- ---------------------------------------------------------------------------
create view public.collectible_inventory
with (security_invoker = true) as
select
  c.id, c.slug, c.tier, c.name, c.subtitle, c.description,
  c.league_id, c.team_id, c.season, c.art, c.attributes,
  c.total_supply, c.claimed_count,
  c.total_supply - c.claimed_count as remaining,
  t.rarity_rank, t.name as tier_name,
  tm.name as team_name, tm.abbreviation as team_abbreviation
from public.collectibles c
join public.collectible_tiers t on t.slug = c.tier
left join public.teams tm on tm.id = c.team_id
where c.is_active;

-- ---------------------------------------------------------------------------
-- New users get a profile automatically
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.sports             enable row level security;
alter table public.leagues            enable row level security;
alter table public.teams              enable row level security;
alter table public.collectible_tiers  enable row level security;
alter table public.collectibles       enable row level security;
alter table public.offer_rules        enable row level security;
alter table public.profiles           enable row level security;
alter table public.team_follows       enable row level security;
alter table public.claim_offers       enable row level security;
alter table public.user_collectibles  enable row level security;

-- Catalog and inventory are public to read (signed in or not).
create policy "catalog readable" on public.sports            for select to anon, authenticated using (true);
create policy "catalog readable" on public.leagues           for select to anon, authenticated using (true);
create policy "catalog readable" on public.teams             for select to anon, authenticated using (true);
create policy "catalog readable" on public.collectible_tiers for select to anon, authenticated using (true);
create policy "catalog readable" on public.collectibles      for select to anon, authenticated using (true);
create policy "catalog readable" on public.offer_rules       for select to anon, authenticated using (true);

-- Personal data: each user sees only their own rows.
create policy "own profile"      on public.profiles          for select to authenticated using (id = (select auth.uid()));
create policy "own profile edit" on public.profiles          for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own follows"      on public.team_follows      for select to authenticated using (user_id = (select auth.uid()));
create policy "own offers"       on public.claim_offers      for select to authenticated using (user_id = (select auth.uid()));
create policy "own collectibles" on public.user_collectibles for select to authenticated using (user_id = (select auth.uid()));

-- Profiles: users may only edit their display name directly. The followed
-- team and onboarding flag change only through functions.
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- No direct writes from clients to anything else.
revoke insert, update, delete on
  public.sports, public.leagues, public.teams, public.collectible_tiers,
  public.collectibles, public.offer_rules, public.team_follows,
  public.claim_offers, public.user_collectibles
from anon, authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
