-- Storage buckets and policies.
--   public-media     approved photos, thumbnails and PDFs (public read; staff write)
--   private-uploads  drafts and embargoed files (staff only; signed URLs)
--   datasets         raw CSVs (staff write; read through signed URLs issued by the server)

insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true),
       ('private-uploads', 'private-uploads', false),
       ('datasets', 'datasets', false)
on conflict (id) do nothing;

create policy "public-media: public read" on storage.objects for select
  using (bucket_id = 'public-media');
create policy "public-media: staff write" on storage.objects for insert
  with check (bucket_id = 'public-media' and public.is_staff());
create policy "public-media: staff update" on storage.objects for update
  using (bucket_id = 'public-media' and public.is_staff());
create policy "public-media: staff delete" on storage.objects for delete
  using (bucket_id = 'public-media' and public.is_staff());

create policy "private-uploads: staff all" on storage.objects for all
  using (bucket_id = 'private-uploads' and public.is_staff())
  with check (bucket_id = 'private-uploads' and public.is_staff());

create policy "datasets: staff all" on storage.objects for all
  using (bucket_id = 'datasets' and public.is_staff())
  with check (bucket_id = 'datasets' and public.is_staff());

-- Realtime: live Review Queue badge and activity feed.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.generations, public.audit_log;
  end if;
end $$;
