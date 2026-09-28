-- Row Level Security: the real guard. Every table has RLS enabled.

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.allowed_staff enable row level security;
alter table public.stations enable row level security;
alter table public.expeditions enable row level security;
alter table public.items enable row level security;
alter table public.item_files enable row level security;
alter table public.chunks enable row level security;
alter table public.dataset_profiles enable row level security;
alter table public.explainers enable row level security;
alter table public.generations enable row level security;
alter table public.generation_claims enable row level security;
alter table public.review_comments enable row level security;
alter table public.content_calendar enable row level security;
alter table public.glossary enable row level security;
alter table public.search_events enable row level security;
alter table public.item_views enable row level security;
alter table public.favourites enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.jobs enable row level security;
alter table public.audit_log enable row level security;

-- ---------------------------------------------------------------- public reference data
create policy "orgs: public read" on public.organizations for select using (true);
create policy "orgs: admin write" on public.organizations for all using (public.is_admin()) with check (public.is_admin());

create policy "stations: public read" on public.stations for select using (true);
create policy "stations: staff write" on public.stations for all using (public.is_staff()) with check (public.is_staff());

create policy "expeditions: public read" on public.expeditions for select using (true);
create policy "expeditions: staff write" on public.expeditions for all
  using (public.is_staff() and org_id = public.current_org())
  with check (public.is_staff() and org_id = public.current_org());

create policy "glossary: public read" on public.glossary for select using (true);
create policy "glossary: staff write" on public.glossary for all using (public.is_staff()) with check (public.is_staff());

create policy "calendar: public read" on public.content_calendar for select using (true);
create policy "calendar: staff write" on public.content_calendar for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------- profiles & staff
create policy "profiles: read own" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin manage" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "allowed_staff: admin only" on public.allowed_staff for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- items
create policy "items: public read released" on public.items for select
  using (status = 'published' and visibility = 'public' and (embargo_until is null or embargo_until <= now()));
create policy "items: staff read org" on public.items for select
  using (public.is_staff() and org_id = public.current_org());
create policy "items: staff insert" on public.items for insert
  with check (public.is_staff() and org_id = public.current_org() and (status <> 'published' or public.is_reviewer()));
create policy "items: staff update" on public.items for update
  using (public.is_staff() and org_id = public.current_org())
  with check (public.is_staff() and org_id = public.current_org() and (status <> 'published' or public.is_reviewer()));
create policy "items: reviewer delete" on public.items for delete
  using (public.is_reviewer() and org_id = public.current_org());

-- Children of items: readable when the parent is publicly released, or by staff of the org.
create policy "item_files: read" on public.item_files for select
  using (public.item_id_is_public(item_id) or public.item_id_in_my_org(item_id));
create policy "item_files: staff write" on public.item_files for all
  using (public.item_id_in_my_org(item_id)) with check (public.item_id_in_my_org(item_id));

create policy "chunks: read" on public.chunks for select
  using (public.item_id_is_public(item_id) or public.item_id_in_my_org(item_id));
create policy "chunks: staff write" on public.chunks for all
  using (public.item_id_in_my_org(item_id)) with check (public.item_id_in_my_org(item_id));

create policy "dataset_profiles: read" on public.dataset_profiles for select
  using (public.item_id_is_public(item_id) or public.item_id_in_my_org(item_id));
create policy "dataset_profiles: staff write" on public.dataset_profiles for all
  using (public.item_id_in_my_org(item_id)) with check (public.item_id_in_my_org(item_id));

create policy "explainers: read" on public.explainers for select
  using (public.item_id_is_public(item_id) or public.item_id_in_my_org(item_id));
-- Explainers are generated server-side on demand for public items only; written via the server.
create policy "explainers: staff write" on public.explainers for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------- generations (Studio)
create policy "generations: public read published articles" on public.generations for select
  using (status = 'published' and channel = 'website_article');
create policy "generations: staff read" on public.generations for select
  using (public.is_staff() and org_id = public.current_org());
create policy "generations: staff insert" on public.generations for insert
  with check (public.is_staff() and org_id = public.current_org() and status in ('draft', 'in_review'));
-- Only reviewers approve/publish, and never their own work (admins may).
create policy "generations: staff update" on public.generations for update
  using (public.is_staff() and org_id = public.current_org())
  with check (
    public.is_staff() and org_id = public.current_org()
    and (
      status in ('draft', 'in_review')
      or (public.is_reviewer() and (created_by is distinct from auth.uid() or public.is_admin()))
    )
  );
create policy "generations: admin delete" on public.generations for delete using (public.is_admin());

create policy "claims: staff" on public.generation_claims for all using (public.is_staff()) with check (public.is_staff());
create policy "review_comments: staff" on public.review_comments for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------- analytics (no personal data)
create policy "search_events: anyone insert" on public.search_events for insert with check (true);
create policy "search_events: staff read" on public.search_events for select using (public.is_staff());
create policy "item_views: anyone insert" on public.item_views for insert
  with check (public.item_id_is_public(item_id) or public.item_id_in_my_org(item_id));
create policy "item_views: staff read" on public.item_views for select using (public.is_staff());

-- ---------------------------------------------------------------- member features
create policy "favourites: owner" on public.favourites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "quiz_attempts: owner" on public.quiz_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- operations
create policy "jobs: staff" on public.jobs for all using (public.is_staff()) with check (public.is_staff());
create policy "audit: staff read" on public.audit_log for select using (public.is_staff());
create policy "audit: staff insert" on public.audit_log for insert with check (public.is_staff() and actor_id = auth.uid());

-- ---------------------------------------------------------------- grants for the API roles
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.search_events, public.item_views to anon;
grant execute on all functions in schema public to anon, authenticated;
