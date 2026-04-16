create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  mobile text not null unique,
  email text default '',
  native_village text default '',
  current_village text default '',
  occupation text default '',
  education text default '',
  total_members int default 1,
  address text default '',
  profile_photo text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text default '',
  relation text default '',
  occupation text default '',
  education text default '',
  mobile text default '',
  gender text default 'પુરુષ',
  photo text default '',
  position int default 0,
  created_at timestamptz not null default now()
);

create index idx_family_members_family_id on public.family_members(family_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

create policy "public read families" on public.families for select using (true);
create policy "public insert families" on public.families for insert with check (true);
create policy "public update families" on public.families for update using (true);
create policy "public delete families" on public.families for delete using (true);

create policy "public read members" on public.family_members for select using (true);
create policy "public insert members" on public.family_members for insert with check (true);
create policy "public update members" on public.family_members for update using (true);
create policy "public delete members" on public.family_members for delete using (true);

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end; $$;

create trigger families_updated_at before update on public.families
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public) values ('family-photos', 'family-photos', true);

create policy "public read family photos" on storage.objects for select using (bucket_id = 'family-photos');
create policy "public upload family photos" on storage.objects for insert with check (bucket_id = 'family-photos');
create policy "public update family photos" on storage.objects for update using (bucket_id = 'family-photos');
create policy "public delete family photos" on storage.objects for delete using (bucket_id = 'family-photos');