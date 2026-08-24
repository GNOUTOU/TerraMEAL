-- TerraMEAL — 0006: pipeline SOURCE → RAW → STAGING → VALIDATION → PRODUCTION + contrôle qualité

create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  source data_source_type not null,
  source_name text,
  data_source_id uuid references data_sources(id) on delete set null,
  file_name text,
  target_entity text not null,          -- intervention | infrastructure | activity | indicator_result | beneficiary
  status import_batch_status not null default 'pending',
  records_total integer not null default 0,
  records_success integer not null default 0,
  records_error integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  triggered_by uuid references profiles(id),
  error_log jsonb not null default '[]'::jsonb,
  notes text
);
create index if not exists import_batches_source_idx on import_batches (source);
create index if not exists import_batches_status_idx on import_batches (status);

-- RAW: copie fidèle de la donnée source, jamais modifiée.
create table if not exists raw_records (
  id uuid primary key default gen_random_uuid(),
  source data_source_type not null,
  source_ref text,                      -- form id Kobo / dataset id mWater / nom de fichier
  import_batch_id uuid references import_batches(id) on delete cascade,
  external_id text,                     -- identifiant dans le système source
  payload jsonb not null,
  imported_at timestamptz not null default now()
);
create index if not exists raw_records_batch_idx on raw_records (import_batch_id);
create index if not exists raw_records_external_idx on raw_records (source, external_id);

-- STAGING: donnée normalisée/nettoyée, en attente de contrôle et de validation.
create table if not exists staging_records (
  id uuid primary key default gen_random_uuid(),
  raw_record_id uuid references raw_records(id) on delete cascade,
  import_batch_id uuid references import_batches(id) on delete cascade,
  target_entity text not null,
  normalized jsonb not null,
  validation_status validation_status not null default 'to_verify',
  promoted_to_id uuid,                  -- id de la ligne PRODUCTION une fois publiée
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists staging_records_batch_idx on staging_records (import_batch_id);
create index if not exists staging_records_status_idx on staging_records (validation_status);

alter table interventions
  add constraint interventions_staging_fk foreign key (staging_record_id) references staging_records(id) on delete set null;

create table if not exists anomalies (
  id uuid primary key default gen_random_uuid(),
  staging_record_id uuid references staging_records(id) on delete cascade,
  entity_table text not null,
  entity_id uuid,
  anomaly_type anomaly_type not null,
  severity anomaly_severity not null default 'warning',
  description text not null,
  detected_at timestamptz not null default now(),
  source data_source_type,
  status anomaly_status not null default 'open',
  assignee_id uuid references profiles(id),
  resolution_comment text,
  resolved_at timestamptz,
  resolved_by uuid references profiles(id)
);
create index if not exists anomalies_status_idx on anomalies (status);
create index if not exists anomalies_severity_idx on anomalies (severity);
create index if not exists anomalies_entity_idx on anomalies (entity_table, entity_id);

comment on table anomalies is '25/27/RG05: une anomalie "blocking" empêche la promotion automatique en PRODUCTION. RG12: les rejets restent tracés (status=rejected), jamais supprimés.';
