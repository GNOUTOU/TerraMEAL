-- TerraMEAL — 0003: gestion des projets (fiche projet complète)

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  manager_id uuid references profiles(id) on delete set null,
  status project_status not null default 'preparation',
  start_date date,
  end_date date,
  year integer,
  reporting_period text,
  budget numeric,
  currency text default 'USD',
  donor_principal_id uuid references donors(id) on delete set null,
  is_archived boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_status_idx on projects (status);
create index if not exists projects_manager_idx on projects (manager_id);
create index if not exists projects_donor_idx on projects (donor_principal_id);
create index if not exists projects_search_idx on projects using gin (
  (coalesce(code,'') || ' ' || coalesce(name,'') || ' ' || coalesce(description,'')) gin_trgm_ops
);

create table if not exists project_donors (
  project_id uuid not null references projects(id) on delete cascade,
  donor_id uuid not null references donors(id) on delete cascade,
  amount numeric,
  currency text,
  is_principal boolean not null default false,
  primary key (project_id, donor_id)
);

create table if not exists project_partners (
  project_id uuid not null references projects(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  role text,
  primary key (project_id, partner_id)
);

create table if not exists project_sectors (
  project_id uuid not null references projects(id) on delete cascade,
  sector_id uuid not null references sectors(id) on delete cascade,
  primary key (project_id, sector_id)
);

create table if not exists project_zones (
  project_id uuid not null references projects(id) on delete cascade,
  admin_zone_id uuid not null references admin_zones(id) on delete cascade,
  primary key (project_id, admin_zone_id)
);

-- Assigns program managers / direction / meal_sig users to specific projects (RG06 scoping).
create table if not exists user_projects (
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_type text,
  visibility_level visibility_level not null default 'restricted',
  description text,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);
