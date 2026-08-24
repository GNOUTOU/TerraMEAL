-- TerraMEAL — 0002: référentiels institutionnels
-- bailleurs, partenaires, secteurs, zones administratives, sources de données, utilisateurs

create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text,
  contact_name text,
  contact_email text,
  contact_phone text,
  country text,
  website text,
  logo_url text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text,
  contact_name text,
  contact_email text,
  contact_phone text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sectors (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  color text not null default '#2563eb',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists subsectors (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references sectors(id) on delete cascade,
  code text not null,
  name text not null,
  active boolean not null default true,
  unique (sector_id, code)
);

create table if not exists admin_zones (
  id uuid primary key default gen_random_uuid(),
  level admin_zone_level not null,
  code text,
  name text not null,
  parent_id uuid references admin_zones(id) on delete set null,
  country_iso3 text,
  geom geometry(MultiPolygon, 4326),
  centroid geometry(Point, 4326),
  population integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists admin_zones_geom_gix on admin_zones using gist (geom);
create index if not exists admin_zones_centroid_gix on admin_zones using gist (centroid);
create index if not exists admin_zones_parent_idx on admin_zones (parent_id);
create index if not exists admin_zones_level_idx on admin_zones (level);

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  type data_source_type not null,
  name text not null,
  description text,
  -- API tokens/credentials. In production, prefer Supabase Vault; kept here behind strict
  -- admin-only RLS for the MVP so the connector code has a single, simple place to read config.
  config jsonb not null default '{}'::jsonb,
  field_mapping jsonb not null default '{}'::jsonb,
  sync_cursor text,
  last_sync_at timestamptz,
  last_sync_status text,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- profiles extends auth.users with TerraMEAL-specific fields (role, scoping, status)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'meal_sig',
  organization text,
  phone text,
  avatar_url text,
  donor_id uuid references donors(id) on delete set null,
  partner_id uuid references partners(id) on delete set null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on profiles (role);

comment on table profiles is 'RG06/RG07/38: role + donor_id/partner_id drive all row-level scoping.';
