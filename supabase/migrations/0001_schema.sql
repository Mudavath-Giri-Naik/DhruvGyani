-- DhruvGyani schema (SIH26063)
-- Embedding dimension 768 MUST match EMBEDDING_DIM in src/lib/constants.ts
-- (enforced by tests/unit/constants.test.ts).

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------- enums
create type public.app_role as enum ('member', 'curator', 'reviewer', 'admin');
create type public.item_type as enum ('report', 'dataset', 'publication', 'photo', 'video', 'activity');
create type public.item_status as enum ('draft', 'in_review', 'published');
create type public.item_visibility as enum ('internal', 'public');
create type public.gen_status as enum ('draft', 'in_review', 'approved', 'published', 'rejected');
create type public.channel as enum ('website_article', 'x', 'facebook', 'instagram', 'linkedin');
create type public.audience as enum ('school', 'college', 'expert', 'public');
create type public.lang as enum ('en', 'hi');
create type public.claim_verdict as enum ('supported', 'weak', 'unsupported');
create type public.job_status as enum ('queued', 'running', 'done', 'failed');

-- ---------------------------------------------------------------- utilities
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- tables
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role public.app_role not null default 'member',
  org_id uuid references public.organizations (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.allowed_staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role public.app_role not null,
  org_id uuid references public.organizations (id),
  created_at timestamptz not null default now()
);

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null,
  lat double precision not null,
  lng double precision not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.expeditions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id),
  code text not null unique,
  region text not null check (region in ('antarctica', 'arctic', 'himalaya', 'southern_ocean', 'ocean')),
  title text not null,
  summary text not null default '',
  start_date date,
  end_date date,
  status text not null default 'planned' check (status in ('planned', 'ongoing', 'completed')),
  cover_url text,
  station_id uuid references public.stations (id),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id),
  type public.item_type not null,
  title text not null,
  description text not null default '',
  expedition_id uuid references public.expeditions (id) on delete set null,
  station_id uuid references public.stations (id) on delete set null,
  discipline text[] not null default '{}',
  tags text[] not null default '{}',
  authors text[] not null default '{}',
  event_date date,
  language public.lang not null default 'en',
  license text,
  source_url text,
  external_url text,
  media_url text,
  alt_text text,
  status public.item_status not null default 'draft',
  visibility public.item_visibility not null default 'internal',
  embargo_until timestamptz,
  is_sample boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  fts tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_files (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  mime text not null,
  size bigint not null default 0,
  checksum text,
  phash text,
  created_at timestamptz not null default now()
);

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  page_no int,
  chunk_index int not null default 0,
  content text not null,
  embedding extensions.vector(768),
  fts tsvector,
  created_at timestamptz not null default now()
);

create table public.dataset_profiles (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.items (id) on delete cascade,
  columns jsonb not null default '[]',
  row_count int not null default 0,
  time_range jsonb,
  units jsonb not null default '{}',
  stats jsonb not null default '{}',
  summary text,
  sample_rows jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.explainers (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  level text not null check (level in ('school', 'college', 'expert')),
  language public.lang not null,
  text text not null,
  citations jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (item_id, level, language)
);

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id),
  item_ids uuid[] not null,
  audience public.audience not null,
  language public.lang not null,
  channel public.channel not null,
  prompt_version text not null,
  model text,
  output jsonb not null,
  citations jsonb not null default '[]',
  slug text unique,
  status public.gen_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generation_claims (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  claim_text text not null,
  chunk_id uuid references public.chunks (id) on delete set null,
  verdict public.claim_verdict not null,
  note text,
  number_misses text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null default '',
  body text not null,
  at timestamptz not null default now()
);

create table public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  occasion text not null,
  occasion_hi text,
  kind text not null default 'occasion' check (kind in ('occasion', 'milestone')),
  suggested_item_ids uuid[] not null default '{}',
  status text not null default 'idea' check (status in ('idea', 'planned', 'done')),
  created_at timestamptz not null default now()
);

create table public.glossary (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  term_hi text not null default '',
  meaning_en text not null,
  meaning_hi text not null,
  created_at timestamptz not null default now()
);

-- No personal data, no IP addresses.
create table public.search_events (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  result_count int not null default 0,
  clicked_item_id uuid references public.items (id) on delete set null,
  at timestamptz not null default now()
);

create table public.item_views (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  at timestamptz not null default now()
);

create table public.favourites (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  score int not null,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}',
  status public.job_status not null default 'queued',
  error text,
  attempts int not null default 0,
  item_id uuid references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}',
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------- updated_at triggers
create trigger t_profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_expeditions_touch before update on public.expeditions for each row execute function public.touch_updated_at();
create trigger t_items_touch before update on public.items for each row execute function public.touch_updated_at();
create trigger t_dataset_profiles_touch before update on public.dataset_profiles for each row execute function public.touch_updated_at();
create trigger t_generations_touch before update on public.generations for each row execute function public.touch_updated_at();
create trigger t_jobs_touch before update on public.jobs for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- full-text search
-- English rows use the `english` config; Hindi rows use `simple`.
create or replace function public.items_fts_refresh() returns trigger
language plpgsql as $$
declare
  cfg regconfig := case when new.language = 'hi' then 'simple'::regconfig else 'english'::regconfig end;
begin
  new.fts :=
    setweight(to_tsvector(cfg, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector(cfg, coalesce(array_to_string(new.tags, ' '), '') || ' ' ||
                               coalesce(array_to_string(new.discipline, ' '), '')), 'B') ||
    setweight(to_tsvector(cfg, coalesce(new.description, '')), 'C') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(array_to_string(new.authors, ' '), '')), 'D');
  return new;
end $$;
create trigger t_items_fts before insert or update on public.items
  for each row execute function public.items_fts_refresh();

create or replace function public.chunks_fts_refresh() returns trigger
language plpgsql as $$
declare
  item_lang public.lang;
begin
  select language into item_lang from public.items where id = new.item_id;
  new.fts := to_tsvector(case when item_lang = 'hi' then 'simple'::regconfig else 'english'::regconfig end,
                         coalesce(new.content, ''));
  return new;
end $$;
create trigger t_chunks_fts before insert or update of content on public.chunks
  for each row execute function public.chunks_fts_refresh();

create index items_fts_idx on public.items using gin (fts);
create index chunks_fts_idx on public.chunks using gin (fts);
create index chunks_embedding_idx on public.chunks using hnsw (embedding extensions.vector_cosine_ops);
create index items_expedition_idx on public.items (expedition_id);
create index items_type_status_idx on public.items (type, status, visibility);
create index chunks_item_idx on public.chunks (item_id);
create index generation_claims_gen_idx on public.generation_claims (generation_id);
create index search_events_at_idx on public.search_events (at);
create index item_views_item_idx on public.item_views (item_id);

-- ---------------------------------------------------------------- role helpers
-- Named app_current_role() because CURRENT_ROLE is a reserved SQL keyword.
create or replace function public.app_current_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_org() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_current_role() in ('curator', 'reviewer', 'admin'), false)
$$;

create or replace function public.is_reviewer() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_current_role() in ('reviewer', 'admin'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_current_role() = 'admin', false)
$$;

-- The public-release rule, in one place.
create or replace function public.item_is_public(i public.items) returns boolean
language sql stable as $$
  select i.status = 'published' and i.visibility = 'public'
         and (i.embargo_until is null or i.embargo_until <= now())
$$;

create or replace function public.item_id_is_public(p_item_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.items i
    where i.id = p_item_id and i.status = 'published' and i.visibility = 'public'
      and (i.embargo_until is null or i.embargo_until <= now())
  )
$$;

create or replace function public.item_id_in_my_org(p_item_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() and exists (
    select 1 from public.items i where i.id = p_item_id and i.org_id = public.current_org()
  )
$$;

-- ---------------------------------------------------------------- new-user trigger
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  staff record;
  default_org uuid;
begin
  select id into default_org from public.organizations where slug = 'ncpor' limit 1;
  select role, org_id into staff from public.allowed_staff where lower(email) = lower(new.email) limit 1;
  insert into public.profiles (id, full_name, email, avatar_url, role, org_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(staff.role, 'member'),
    coalesce(staff.org_id, default_org)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- When an admin adds/changes an allow-list entry, apply it to an existing profile.
create or replace function public.sync_allowed_staff() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set role = new.role, org_id = coalesce(new.org_id, org_id)
  where lower(email) = lower(new.email);
  return new;
end $$;
create trigger t_allowed_staff_sync after insert or update on public.allowed_staff
  for each row execute function public.sync_allowed_staff();

-- Users may edit their own profile but never their own role.
-- SECURITY INVOKER on purpose: current_user must be the caller's role
-- (authenticated), not the function owner.
create or replace function public.guard_profile_role() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin')
     and pg_trigger_depth() <= 1 then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end $$;
create trigger t_profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Approval gate: a generation with unsupported claims or unmatched numbers
-- cannot move to approved/published. This is the database-level guard.
create or replace function public.guard_generation_approval() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved', 'published') and old.status is distinct from new.status then
    if exists (
      select 1 from public.generation_claims c
      where c.generation_id = new.id
        and (c.verdict = 'unsupported' or cardinality(c.number_misses) > 0)
    ) then
      raise exception 'Generation has unsupported claims or unmatched numbers';
    end if;
  end if;
  return new;
end $$;
create trigger t_generations_guard before update on public.generations
  for each row execute function public.guard_generation_approval();

-- ---------------------------------------------------------------- hybrid search
-- Keyword (FTS) + semantic (pgvector) with reciprocal rank fusion, grouped by
-- item. SECURITY INVOKER so RLS decides what each caller can see.
create or replace function public.search_items(
  query_text text,
  query_embedding extensions.vector(768) default null,
  filter_types public.item_type[] default null,
  filter_expedition uuid default null,
  filter_station uuid default null,
  filter_year int default null,
  filter_discipline text default null,
  filter_language public.lang default null,
  match_count int default 24,
  rrf_k int default 50
)
returns table (item_id uuid, snippet text, score double precision)
language sql stable security invoker set search_path = public, extensions as $$
  with q as (
    select websearch_to_tsquery('english', query_text) || websearch_to_tsquery('simple', query_text) as tsq
  ),
  candidates as (
    select i.* from public.items i
    where (filter_types is null or i.type = any (filter_types))
      and (filter_expedition is null or i.expedition_id = filter_expedition)
      and (filter_station is null or i.station_id = filter_station)
      and (filter_year is null or extract(year from i.event_date) = filter_year)
      and (filter_discipline is null or filter_discipline = any (i.discipline))
      and (filter_language is null or i.language = filter_language)
  ),
  kw_items as (
    select c.id as item_id, null::text as content,
           row_number() over (order by ts_rank_cd(c.fts, q.tsq) desc) as rank_ix
    from candidates c, q
    where c.fts @@ q.tsq
    order by rank_ix
    limit match_count * 2
  ),
  kw_chunks as (
    select ch.item_id, ch.content,
           row_number() over (order by ts_rank_cd(ch.fts, q.tsq) desc) as rank_ix
    from public.chunks ch join candidates c on c.id = ch.item_id, q
    where ch.fts @@ q.tsq
    order by rank_ix
    limit match_count * 4
  ),
  sem_chunks as (
    select ch.item_id, ch.content,
           row_number() over (order by ch.embedding <=> query_embedding) as rank_ix
    from public.chunks ch join candidates c on c.id = ch.item_id
    where query_embedding is not null and ch.embedding is not null
    order by rank_ix
    limit match_count * 4
  ),
  all_hits as (
    select * from kw_items union all select * from kw_chunks union all select * from sem_chunks
  ),
  fused as (
    select item_id, sum(1.0 / (rrf_k + rank_ix))::double precision as score
    from all_hits group by item_id
  ),
  best as (
    select distinct on (item_id) item_id, content
    from all_hits where content is not null
    order by item_id, rank_ix
  )
  select f.item_id, coalesce(left(b.content, 300), left(c.description, 300)) as snippet, f.score
  from fused f
  join candidates c on c.id = f.item_id
  left join best b on b.item_id = f.item_id
  order by f.score desc
  limit match_count
$$;

-- Semantic retrieval scoped to specific items (Studio, Ask NCPOR).
create or replace function public.match_chunks(
  query_embedding extensions.vector(768),
  item_ids uuid[] default null,
  match_count int default 8
)
returns table (id uuid, item_id uuid, page_no int, content text, similarity double precision)
language sql stable security invoker set search_path = public, extensions as $$
  select ch.id, ch.item_id, ch.page_no, ch.content, 1 - (ch.embedding <=> query_embedding) as similarity
  from public.chunks ch
  where ch.embedding is not null and (item_ids is null or ch.item_id = any (item_ids))
  order by ch.embedding <=> query_embedding
  limit match_count
$$;
