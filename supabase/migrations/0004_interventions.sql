-- TerraMEAL — 0004: interventions (entité centrale), infrastructures, activités, bénéficiaires

create table if not exists interventions (
  id uuid primary key default gen_random_uuid(),
  source_id text,                          -- identifiant provenant de la source (Kobo/mWater/fichier)
  source data_source_type not null default 'manual',
  staging_record_id uuid,                  -- traçabilité vers le pipeline (RG03)
  project_id uuid not null references projects(id) on delete restrict,
  sector_id uuid references sectors(id),
  subsector_id uuid references subsectors(id),
  category text,                           -- 'infrastructure' | 'activity' | 'realisation'
  type text not null,
  name text not null,
  description text,
  admin_zone_id uuid references admin_zones(id),
  geom geometry(Geometry, 4326),
  date date,
  status text not null default 'planifie',
  beneficiaries_total integer,
  validation_status validation_status not null default 'imported',
  sensitivity_level smallint not null default 1 check (sensitivity_level between 1 and 4),
  rejection_reason text,
  last_updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists interventions_geom_gix on interventions using gist (geom);
create index if not exists interventions_project_idx on interventions (project_id);
create index if not exists interventions_sector_idx on interventions (sector_id);
create index if not exists interventions_zone_idx on interventions (admin_zone_id);
create index if not exists interventions_validation_idx on interventions (validation_status);
create index if not exists interventions_date_idx on interventions (date);
create index if not exists interventions_search_idx on interventions using gin (
  (coalesce(name,'') || ' ' || coalesce(type,'') || ' ' || coalesce(source_id,'')) gin_trgm_ops
);

comment on table interventions is 'RG02: chaque intervention appartient à un projet. RG11: source + validation_status + last_updated_at obligatoires avant publication.';

create table if not exists infrastructures (
  intervention_id uuid primary key references interventions(id) on delete cascade,
  infra_type text not null,               -- forage, point d'eau, latrine, école, salle de classe, centre de santé...
  capacity numeric,
  functional_status infra_functional_status not null default 'functional',
  rehabilitated boolean not null default false
);

create table if not exists activities (
  intervention_id uuid primary key references interventions(id) on delete cascade,
  activity_type text not null,            -- formation, distribution, activité communautaire, session...
  participants_count integer,
  sessions_count integer,
  location_text text
);

create table if not exists beneficiaries_breakdown (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid references interventions(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  period text,
  sex text,                                -- 'male' | 'female' | 'other' | null
  age_bracket text,
  count integer not null check (count >= 0),
  notes text,
  created_at timestamptz not null default now(),
  check (intervention_id is not null or project_id is not null)
);
create index if not exists beneficiaries_intervention_idx on beneficiaries_breakdown (intervention_id);
create index if not exists beneficiaries_project_idx on beneficiaries_breakdown (project_id);

comment on table beneficiaries_breakdown is '19: bénéficiaires agrégés uniquement — jamais de données nominatives (hors périmètre MVP, niveau 4).';
