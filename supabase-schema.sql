create table if not exists public.game_drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  categories jsonb not null default '[]'::jsonb,
  clues jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score bigint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.game_teams
alter column score type bigint using score::bigint;

create table if not exists public.completed_clues (
  draft_id uuid not null references public.game_drafts(id) on delete cascade,
  clue_key text not null,
  created_at timestamptz not null default now(),
  primary key (draft_id, clue_key)
);

alter table public.game_drafts enable row level security;
alter table public.game_teams enable row level security;
alter table public.completed_clues enable row level security;

drop policy if exists "Allow anon read game drafts" on public.game_drafts;
drop policy if exists "Allow anon insert game drafts" on public.game_drafts;
drop policy if exists "Allow anon update game drafts" on public.game_drafts;
drop policy if exists "Allow anon delete game drafts" on public.game_drafts;

create policy "Allow anon read game drafts"
on public.game_drafts for select to anon using (true);

create policy "Allow anon insert game drafts"
on public.game_drafts for insert to anon with check (true);

create policy "Allow anon update game drafts"
on public.game_drafts for update to anon using (true) with check (true);

create policy "Allow anon delete game drafts"
on public.game_drafts for delete to anon using (true);

drop policy if exists "Allow anon read game teams" on public.game_teams;
drop policy if exists "Allow anon insert game teams" on public.game_teams;
drop policy if exists "Allow anon update game teams" on public.game_teams;
drop policy if exists "Allow anon delete game teams" on public.game_teams;

create policy "Allow anon read game teams"
on public.game_teams for select to anon using (true);

create policy "Allow anon insert game teams"
on public.game_teams for insert to anon with check (true);

create policy "Allow anon update game teams"
on public.game_teams for update to anon using (true) with check (true);

create policy "Allow anon delete game teams"
on public.game_teams for delete to anon using (true);

drop policy if exists "Allow anon read completed clues" on public.completed_clues;
drop policy if exists "Allow anon insert completed clues" on public.completed_clues;
drop policy if exists "Allow anon delete completed clues" on public.completed_clues;

create policy "Allow anon read completed clues"
on public.completed_clues for select to anon using (true);

create policy "Allow anon insert completed clues"
on public.completed_clues for insert to anon with check (true);

create policy "Allow anon delete completed clues"
on public.completed_clues for delete to anon using (true);
