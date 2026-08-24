-- TerraMEAL — 0007: preuves/documents génériques, journal d'activité, notifications, paramètres

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  entity_table text not null,
  entity_id uuid not null,
  name text not null,
  file_path text not null,
  file_type text,
  visibility_level visibility_level not null default 'restricted',
  description text,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);
create index if not exists documents_entity_idx on documents (entity_table, entity_id);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,               -- create | update | delete | publish | export | sync | login | role_change...
  entity_table text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  source text,
  validation_status text,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_user_idx on activity_log (user_id);
create index if not exists activity_log_entity_idx on activity_log (entity_table, entity_id);
create index if not exists activity_log_created_idx on activity_log (created_at desc);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,                 -- anomaly | sync_failed | pending_validation | stale_data | missing_field | import_error
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, is_read);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

insert into app_settings (key, value, description) values
  ('public_portal_enabled', 'false', 'Active/désactive le portail public (32).'),
  ('data_freshness_days', '180', 'Seuil (jours) au-delà duquel une intervention est considérée obsolète (25.6).'),
  ('gps_duplicate_threshold', '5', 'Nombre de points identiques à partir duquel une alerte de doublon GPS est levée (25.1).'),
  ('future_date_tolerance_days', '7', 'Tolérance (jours) avant qu''une date future soit jugée incohérente (25.3).'),
  ('org_name', '"TerraMEAL"', 'Nom de l''organisation affiché dans l''interface.')
on conflict (key) do nothing;
