-- CodeNeuron schema for Supabase (optional but recommended).
-- Run this in the Supabase SQL editor once you have a project.

create table if not exists public.sessions (
  id uuid primary key,
  title text not null default 'Untitled Review',
  code text not null default '',
  language text not null default 'typescript',
  analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Sessions are readable by all" on public.sessions
  for select using (true);
create policy "Sessions are writable by all" on public.sessions
  for all using (true) with check (true);

create table if not exists public.comments (
  id uuid primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  line int not null,
  author text not null default 'Anonymous',
  author_color text not null default '#06b6d4',
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comments are readable by all" on public.comments
  for select using (true);
create policy "Comments are writable by all" on public.comments
  for all using (true) with check (true);

-- Real-time requires the publication.
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.comments;
