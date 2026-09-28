-- Organisation-level settings (branding, languages, channel templates, embargo defaults).
alter table public.organizations add column if not exists settings jsonb not null default '{}';
