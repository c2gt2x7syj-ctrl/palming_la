create extension if not exists pgcrypto;

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_type text not null default 'roupa',
  product_name text,
  category text,
  brand text,
  color text,
  size text,
  item_condition text,
  measures text,
  notes text,
  image_data_url text,
  suggested_title text,
  alternate_titles jsonb not null default '[]'::jsonb,
  description text,
  hot_score integer,
  hot_label text,
  score_reasons jsonb not null default '[]'::jsonb,
  photo_review jsonb not null default '[]'::jsonb,
  instagram_hook text,
  instagram_caption text,
  instagram_cta text,
  instagram_hashtags jsonb not null default '[]'::jsonb,
  instagram_tips jsonb not null default '[]'::jsonb,
  source text,
  warning text
);

create index if not exists analyses_created_at_idx on public.analyses (created_at desc);
create index if not exists analyses_product_type_idx on public.analyses (product_type);
create index if not exists analyses_hot_score_idx on public.analyses (hot_score desc);

alter table public.analyses enable row level security;

drop policy if exists "service role can manage analyses" on public.analyses;
create policy "service role can manage analyses"
on public.analyses
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
