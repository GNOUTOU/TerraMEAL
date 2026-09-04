"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { runQualityChecks } from "@/lib/quality/rules";
import { interventionColumnsFromNormalized, orderLatLng, toNumber } from "@/lib/import/normalize";
import type { DataSourceType } from "@/lib/types";

// STAGING → VALIDATION → PRODUCTION (24/26). RG04/RG05 : une donnée Kobo/mWater/fichier n'est
// jamais publiée directement — un utilisateur autorisé doit relire puis "promouvoir" chaque ligne.
export async function promoteStagingRecord(id: string, overrides?: Record<string, unknown>) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();

  const { data: staging } = await supabase.from("staging_records").select("*, raw_records(source)").eq("id", id).single();
  if (!staging) return { error: "Enregistrement introuvable." };

  const normalized = { ...(staging.normalized as Record<string, unknown>), ...(overrides ?? {}) };

  const str = (v: unknown) => (v == null || String(v).trim() === "" ? null : String(v).trim());
  // Colonnes uuid : une chaîne vide venant d'un <select> non renseigné doit devenir NULL,
  // sinon Postgres renvoie « invalid input syntax for type uuid: "" ».
  const uuid = (v: unknown) => {
    const s = str(v);
    return s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ? s : null;
  };

  const projectId = uuid(normalized.project_id);
  if (!projectId) return { error: "Projet cible manquant — complétez la ligne avant de la promouvoir." };

  const { lat, lng } = orderLatLng(toNumber(normalized.lat), toNumber(normalized.lng));
  const geom = lat != null && lng != null ? `SRID=4326;POINT(${lng} ${lat})` : null;

  const cols = interventionColumnsFromNormalized(normalized);
  const source = ((staging.raw_records as unknown as { source: DataSourceType } | null)?.source ?? "manual") as DataSourceType;

  const { data: intervention, error } = await supabase
    .from("interventions")
    .insert({
      ...cols,
      source,
      source_id: str(normalized.external_id),
      staging_record_id: staging.id,
      project_id: projectId,
      sector_id: uuid(normalized.sector_id),
      subsector_id: uuid(normalized.subsector_id),
      implementing_partner_id: uuid(normalized.implementing_partner_id),
      admin_zone_id: uuid(normalized.admin_zone_id),
      geom,
      validation_status: "validated",
      created_by: userId,
      last_updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !intervention) return { error: error?.message ?? "Impossible de créer la réalisation." };

  // Ventilation H/F -> lignes de désagrégation (visibles dans la fiche « Bénéficiaires désagrégés »).
  const breakdown: { intervention_id: string; project_id: string; sex: string; count: number }[] = [];
  if (cols.beneficiaries_female != null) breakdown.push({ intervention_id: intervention.id, project_id: projectId, sex: "female", count: cols.beneficiaries_female });
  if (cols.beneficiaries_male != null) breakdown.push({ intervention_id: intervention.id, project_id: projectId, sex: "male", count: cols.beneficiaries_male });
  if (breakdown.length) await supabase.from("beneficiaries_breakdown").insert(breakdown);

  await supabase
    .from("staging_records")
    .update({ validation_status: "validated", promoted_to_id: intervention.id, reviewed_by: userId, reviewed_at: new Date().toISOString(), normalized })
    .eq("id", id);

  await runQualityChecks({ interventionId: intervention.id, source });

  revalidatePath("/import/review");
  revalidatePath("/interventions");
  revalidatePath("/quality");
  return { success: true, interventionId: intervention.id };
}

export async function updateStagingNormalized(id: string, values: Record<string, unknown>) {
  await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const { data: staging } = await supabase.from("staging_records").select("normalized").eq("id", id).single();
  if (!staging) return { error: "Introuvable." };

  const merged = { ...(staging.normalized as Record<string, unknown>), ...values };
  const { error } = await supabase.from("staging_records").update({ normalized: merged }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/import/review");
  return { success: true };
}

export async function rejectStagingRecord(id: string, reason: string) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("staging_records")
    .update({ validation_status: "rejected", reviewed_by: userId, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "update",
    entity_table: "staging_records",
    entity_id: id,
    new_value: { validation_status: "rejected", reason },
    validation_status: "rejected",
  });

  revalidatePath("/import/review");
  return { success: true };
}

// Suppression définitive d'un enregistrement STAGING encore en attente (RG12 : ne concerne
// jamais une donnée déjà promue en PRODUCTION). Supprime aussi le RAW orphelin associé.
export async function deleteStagingRecord(id: string) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();

  const { data: staging } = await supabase
    .from("staging_records")
    .select("id, raw_record_id, validation_status, promoted_to_id")
    .eq("id", id)
    .single();
  if (!staging) return { error: "Enregistrement introuvable." };
  if (staging.promoted_to_id || staging.validation_status === "validated") {
    return { error: "Cet enregistrement a déjà été promu en PRODUCTION — suppression impossible." };
  }

  const { error } = await supabase.from("staging_records").delete().eq("id", id);
  if (error) return { error: error.message };

  if (staging.raw_record_id) {
    await supabase.from("raw_records").delete().eq("id", staging.raw_record_id);
  }

  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "delete",
    entity_table: "staging_records",
    entity_id: id,
    old_value: { validation_status: staging.validation_status },
  });

  revalidatePath("/import/review");
  return { success: true };
}

export async function deleteStagingRecords(ids: string[]) {
  let deleted = 0;
  const errors: string[] = [];
  for (const id of ids) {
    const res = await deleteStagingRecord(id);
    if ("error" in res && res.error) errors.push(res.error);
    else deleted += 1;
  }
  revalidatePath("/import/review");
  return { deleted, errors };
}

export async function rejectStagingRecords(ids: string[], reason: string) {
  let rejected = 0;
  const errors: string[] = [];
  for (const id of ids) {
    const res = await rejectStagingRecord(id, reason);
    if ("error" in res && res.error) errors.push(res.error);
    else rejected += 1;
  }
  revalidatePath("/import/review");
  return { rejected, errors };
}

export async function promoteStagingRecords(ids: string[]) {
  let promoted = 0;
  const errors: string[] = [];
  for (const id of ids) {
    const res = await promoteStagingRecord(id);
    if (res.error) errors.push(res.error);
    else promoted += 1;
  }
  revalidatePath("/import/review");
  revalidatePath("/interventions");
  revalidatePath("/quality");
  return { promoted, errors };
}
