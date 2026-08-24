-- TerraMEAL — 0001: extensions & enumerated types
-- PostGIS for all geospatial columns, pg_trgm for fuzzy/global search.

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum (
    'admin',            -- Administrateur TerraMEAL
    'meal_sig',         -- Utilisateur MEAL / SIG
    'program_manager',  -- Responsable Programme / Projet
    'direction',        -- Direction
    'donor',            -- Bailleur
    'partner',          -- Partenaire
    'public'            -- Public / Communication (portail public)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum (
    'preparation', 'active', 'suspended', 'closed', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type validation_status as enum (
    'imported', 'to_verify', 'validated', 'published', 'archived', 'rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type data_source_type as enum (
    'kobo', 'mwater', 'csv', 'excel', 'geojson', 'kml', 'geopackage', 'manual'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_zone_level as enum (
    'country', 'region', 'province', 'commune', 'locality'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type visibility_level as enum (
    'public', 'restricted', 'sensitive', 'forbidden'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type anomaly_severity as enum ('info', 'warning', 'blocking');
exception when duplicate_object then null; end $$;

do $$ begin
  create type anomaly_status as enum ('open', 'in_review', 'corrected', 'rejected', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type anomaly_type as enum (
    'missing_gps', 'zero_gps', 'gps_out_of_country', 'gps_zone_mismatch',
    'duplicate_gps', 'unknown_reference', 'incoherent_date', 'duplicate_record',
    'missing_required_field', 'stale_data'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type import_batch_status as enum ('pending', 'processing', 'completed', 'completed_with_errors', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type infra_functional_status as enum ('functional', 'non_functional', 'under_construction', 'rehabilitated', 'abandoned');
exception when duplicate_object then null; end $$;
