import { createClient } from "@/lib/supabase/server";
import type { AnomalySeverity, AnomalyType, DataSourceType } from "@/lib/types";

// Moteur de contrôle qualité (25) — exécuté après chaque création/mise à jour d'intervention,
// manuelle ou issue du pipeline d'import. Ré-évaluable à tout moment (idempotent) : les
// anomalies "ouvertes" précédemment détectées par ces mêmes règles sont remplacées.
const CHECKED_TYPES: AnomalyType[] = [
  "missing_gps",
  "zero_gps",
  "gps_out_of_country",
  "gps_zone_mismatch",
  "duplicate_gps",
  "incoherent_date",
  "duplicate_record",
  "missing_required_field",
];

interface Found {
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
}

export async function runQualityChecks({
  interventionId,
  source,
}: {
  interventionId: string;
  source?: DataSourceType;
}) {
  const supabase = await createClient();

  const { data: intervention } = await supabase
    .from("interventions")
    .select("id, name, type, project_id, sector_id, admin_zone_id, date")
    .eq("id", interventionId)
    .single();
  if (!intervention) return;

  const found: Found[] = [];

  // 25.1 Géographie — une seule fonction SQL fait tout le travail PostGIS.
  const { data: geoRows } = await supabase.rpc("quality_check_geo", { p_intervention_id: interventionId });
  const geo = geoRows?.[0];
  if (geo) {
    if (!geo.has_geom) {
      found.push({ type: "missing_gps", severity: "warning", description: "Aucune coordonnée GPS renseignée pour cette réalisation." });
    } else {
      if (geo.is_zero) found.push({ type: "zero_gps", severity: "blocking", description: "Coordonnées GPS égales à (0,0)." });
      if (geo.out_of_country) found.push({ type: "gps_out_of_country", severity: "blocking", description: "Le point GPS se situe hors des frontières du pays." });
      if (geo.zone_mismatch) found.push({ type: "gps_zone_mismatch", severity: "warning", description: "Le point GPS ne se trouve pas dans la zone administrative déclarée." });
      if (geo.duplicate_count > 0) {
        const { data: threshold } = await supabase.from("app_settings").select("value").eq("key", "gps_duplicate_threshold").single();
        const dupThreshold = Number(threshold?.value ?? 5);
        if (geo.duplicate_count >= dupThreshold) {
          found.push({ type: "duplicate_gps", severity: "warning", description: `${geo.duplicate_count} autres réalisations partagent exactement les mêmes coordonnées GPS.` });
        }
      }
    }
  }

  // 25.3 Dates
  if (intervention.date) {
    const { data: tolerance } = await supabase.from("app_settings").select("value").eq("key", "future_date_tolerance_days").single();
    const toleranceDays = Number(tolerance?.value ?? 7);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + toleranceDays);
    if (new Date(intervention.date) > maxDate) {
      found.push({ type: "incoherent_date", severity: "warning", description: `Date (${intervention.date}) dans le futur au-delà de la tolérance autorisée.` });
    }
  }

  // 25.4 Doublons (même projet, type, zone, date)
  if (intervention.date && intervention.admin_zone_id) {
    const { data: dupes } = await supabase
      .from("interventions")
      .select("id")
      .eq("project_id", intervention.project_id)
      .eq("type", intervention.type)
      .eq("admin_zone_id", intervention.admin_zone_id)
      .eq("date", intervention.date)
      .neq("id", interventionId)
      .limit(1);
    if (dupes && dupes.length > 0) {
      found.push({
        type: "duplicate_record",
        severity: "warning",
        description: "Une autre réalisation du même type existe pour ce projet, cette zone et cette date.",
      });
    }
  }

  // 25.5 Complétude
  const missingFields: string[] = [];
  if (!intervention.sector_id) missingFields.push("secteur");
  if (!intervention.admin_zone_id) missingFields.push("zone administrative");
  if (!intervention.date) missingFields.push("date");
  if (missingFields.length > 0) {
    found.push({
      type: "missing_required_field",
      severity: "blocking",
      description: `Champ(s) obligatoire(s) manquant(s) : ${missingFields.join(", ")}.`,
    });
  }

  // Remplace les anomalies ouvertes précédemment générées par ces règles pour cette entité.
  await supabase
    .from("anomalies")
    .update({ status: "corrected", resolved_at: new Date().toISOString() })
    .eq("entity_table", "interventions")
    .eq("entity_id", interventionId)
    .eq("status", "open")
    .in("anomaly_type", CHECKED_TYPES);

  if (found.length > 0) {
    await supabase.from("anomalies").insert(
      found.map((f) => ({
        entity_table: "interventions",
        entity_id: interventionId,
        anomaly_type: f.type,
        severity: f.severity,
        description: f.description,
        source: source ?? "manual",
        status: "open",
      }))
    );
  }

  return found;
}
