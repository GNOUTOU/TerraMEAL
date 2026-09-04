// Types métier partagés — reflètent le schéma SQL (supabase/migrations).
// Pas de génération automatique (pas de projet Supabase live) : à garder synchronisé à la main,
// ou à remplacer par `supabase gen types typescript` une fois le projet créé.

export type UserRole =
  | "admin"
  | "meal_sig"
  | "program_manager"
  | "direction"
  | "donor"
  | "partner"
  | "public";

export type ProjectStatus = "preparation" | "active" | "suspended" | "closed" | "archived";

export type ValidationStatus = "imported" | "to_verify" | "validated" | "published" | "archived" | "rejected";

export type DataSourceType = "kobo" | "mwater" | "csv" | "excel" | "geojson" | "kml" | "geopackage" | "manual";

export type AdminZoneLevel = "country" | "region" | "province" | "commune" | "locality";

export type VisibilityLevel = "public" | "restricted" | "sensitive" | "forbidden";

export type AnomalySeverity = "info" | "warning" | "blocking";

export type AnomalyStatus = "open" | "in_review" | "corrected" | "rejected" | "closed";

export type AnomalyType =
  | "missing_gps"
  | "zero_gps"
  | "gps_out_of_country"
  | "gps_zone_mismatch"
  | "duplicate_gps"
  | "unknown_reference"
  | "incoherent_date"
  | "duplicate_record"
  | "missing_required_field"
  | "stale_data";

export type ImportBatchStatus = "pending" | "processing" | "completed" | "completed_with_errors" | "failed";

export type InfraFunctionalStatus = "functional" | "non_functional" | "under_construction" | "rehabilitated" | "abandoned";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  organization: string | null;
  phone: string | null;
  avatar_url: string | null;
  donor_id: string | null;
  partner_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  code: string;
  name: string;
  type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sector {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string;
  active: boolean;
  created_at: string;
}

export interface Subsector {
  id: string;
  sector_id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface AdminZone {
  id: string;
  level: AdminZoneLevel;
  code: string | null;
  name: string;
  parent_id: string | null;
  country_iso3: string | null;
  geom: unknown | null;
  centroid: unknown | null;
  population: number | null;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  field_mapping: Record<string, unknown>;
  sync_cursor: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  year: number | null;
  reporting_period: string | null;
  budget: number | null;
  currency: string | null;
  donor_principal_id: string | null;
  objectives: string | null;
  target_groups: string | null;
  is_archived: boolean;
  is_hidden: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: string;
  source_id: string | null;
  source: DataSourceType;
  staging_record_id: string | null;
  project_id: string;
  sector_id: string | null;
  subsector_id: string | null;
  category: string | null;
  type: string;
  name: string;
  description: string | null;
  admin_zone_id: string | null;
  implementing_partner_id: string | null;
  geom: unknown | null;
  date: string | null;
  status: string;
  beneficiaries_total: number | null;
  beneficiaries_female: number | null;
  beneficiaries_male: number | null;
  realisation_nature: string | null;
  author_type: "prestataire" | "organisation" | null;
  author_name: string | null;
  country: string | null;
  region: string | null;
  province: string | null;
  commune: string | null;
  village: string | null;
  photos: string[];
  import_extras: Record<string, unknown>;
  validation_status: ValidationStatus;
  sensitivity_level: 1 | 2 | 3 | 4;
  rejection_reason: string | null;
  last_updated_at: string;
  created_by: string | null;
  created_at: string;
}

export interface Infrastructure {
  intervention_id: string;
  infra_type: string;
  capacity: number | null;
  functional_status: InfraFunctionalStatus;
  rehabilitated: boolean;
}

export interface Activity {
  intervention_id: string;
  activity_type: string;
  participants_count: number | null;
  sessions_count: number | null;
  location_text: string | null;
}

export interface BeneficiaryBreakdown {
  id: string;
  intervention_id: string | null;
  project_id: string | null;
  period: string | null;
  sex: string | null;
  age_bracket: string | null;
  count: number;
  notes: string | null;
  created_at: string;
}

export interface Indicator {
  id: string;
  code: string;
  label: string;
  definition: string | null;
  unit: string | null;
  sector_id: string | null;
  source: string | null;
  calculation_method: string | null;
  numerator: string | null;
  denominator: string | null;
  frequency: string | null;
  disaggregations: unknown[];
  baseline_value: number | null;
  validation_status: ValidationStatus;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IndicatorResult {
  id: string;
  indicator_id: string;
  project_id: string | null;
  admin_zone_id: string | null;
  period: string;
  year: number | null;
  target_value: number | null;
  actual_value: number | null;
  achievement_rate?: number | null;
  validation_status: ValidationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportBatch {
  id: string;
  source: DataSourceType;
  source_name: string | null;
  data_source_id: string | null;
  file_name: string | null;
  target_entity: string;
  status: ImportBatchStatus;
  records_total: number;
  records_success: number;
  records_error: number;
  started_at: string;
  finished_at: string | null;
  triggered_by: string | null;
  error_log: unknown[];
  notes: string | null;
}

export interface StagingRecord {
  id: string;
  raw_record_id: string | null;
  import_batch_id: string | null;
  target_entity: string;
  normalized: Record<string, unknown>;
  validation_status: ValidationStatus;
  promoted_to_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Anomaly {
  id: string;
  staging_record_id: string | null;
  entity_table: string;
  entity_id: string | null;
  anomaly_type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  detected_at: string;
  source: DataSourceType | null;
  status: AnomalyStatus;
  assignee_id: string | null;
  resolution_comment: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface DocumentRecord {
  id: string;
  entity_table: string;
  entity_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  visibility_level: VisibilityLevel;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_table: string | null;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  source: string | null;
  validation_status: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DashboardKpis {
  projects_active: number;
  projects_total: number;
  communes_covered: number;
  localities_covered: number;
  interventions_count: number;
  beneficiaries_total: number;
  partners_count: number;
  donors_count: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  meal_sig: "MEAL / SIG",
  program_manager: "Responsable Programme",
  direction: "Direction",
  donor: "Bailleur",
  partner: "Partenaire",
  public: "Public",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  preparation: "En préparation",
  active: "Actif",
  suspended: "Suspendu",
  closed: "Clôturé",
  archived: "Archivé",
};

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  imported: "Importé",
  to_verify: "À vérifier",
  validated: "Validé",
  published: "Publié",
  archived: "Archivé",
  rejected: "Rejeté",
};

export const ANOMALY_SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  info: "Information",
  warning: "Avertissement",
  blocking: "Bloquant",
};

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  missing_gps: "Coordonnées GPS absentes",
  zero_gps: "Coordonnées GPS à (0,0)",
  gps_out_of_country: "Point hors du pays",
  gps_zone_mismatch: "Incohérence avec la zone déclarée",
  duplicate_gps: "Coordonnées identiques répétées",
  unknown_reference: "Référentiel inconnu",
  incoherent_date: "Date incohérente",
  duplicate_record: "Doublon potentiel",
  missing_required_field: "Champ obligatoire manquant",
  stale_data: "Donnée non rafraîchie",
};

export const DATA_SOURCE_LABELS: Record<DataSourceType, string> = {
  kobo: "KoboToolbox",
  mwater: "mWater",
  csv: "CSV",
  excel: "Excel",
  geojson: "GeoJSON",
  kml: "KML",
  geopackage: "GeoPackage",
  manual: "Saisie manuelle",
};
