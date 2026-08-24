-- TerraMEAL — 0005: référentiel d'indicateurs et résultats (cible / réalisé / taux d'atteinte)

create table if not exists indicators (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  definition text,
  unit text,
  sector_id uuid references sectors(id),
  source text,
  calculation_method text,
  numerator text,
  denominator text,
  frequency text,                 -- mensuel, trimestriel, annuel...
  disaggregations jsonb not null default '[]'::jsonb,
  baseline_value numeric,
  validation_status validation_status not null default 'validated',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists indicators_sector_idx on indicators (sector_id);

create table if not exists indicator_results (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references indicators(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  admin_zone_id uuid references admin_zones(id),
  period text not null,           -- ex: '2026-Q1', '2026'
  year integer,
  target_value numeric,
  actual_value numeric,
  validation_status validation_status not null default 'imported',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists indicator_results_indicator_idx on indicator_results (indicator_id);
create index if not exists indicator_results_project_idx on indicator_results (project_id);
create unique index if not exists indicator_results_unique_period
  on indicator_results (indicator_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(admin_zone_id, '00000000-0000-0000-0000-000000000000'::uuid), period);

create or replace view indicator_results_with_rate as
select
  ir.*,
  case when ir.target_value is not null and ir.target_value <> 0
    then round((ir.actual_value / ir.target_value) * 100, 2)
    else null
  end as achievement_rate
from indicator_results ir;
