"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { runQualityChecks } from "@/lib/quality/rules";
import type { DataSourceType } from "@/lib/types";

// STAGING → VALIDATION → PRODUCTION (24/26). RG04/RG05 : une donnée Kobo/mWater/fichier n'est
// jamais publiée directement — un utilisateur autorisé doit relire puis "promouvoir" chaque ligne.
export async function promoteStagingRecord(id: string, overrides?: Record<string, unknown>) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();

  const { data: staging } = await supabase.from("staging_records").select("*, raw_records(source)").eq("id", id).single();
  if (!staging) return { error: "Enregistrement introuvable." };

  const normalized = { ...(staging.normalized as Record<string, unknown>), ...(overrides ?? {}) };
  const lat = normalized.lat != null ? Number(normalized.lat) : null;
  const lng = normalized.lng != null ? Number(normalized.lng) : null;
  const geom = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng) ? `SRID=4326;POINT(${lng} ${lat})` : null;

  if (!normalized.project_id) return { error: "Projet cible manquant — complétez la ligne avant de la promouvoir." };

  const source = ((staging.raw_records as unknown as { source: DataSourceType } | null)?.source ?? "manual") as DataSourceType;

  const { data: intervention, error } = await supabase
    .from("interventions")
    .insert({
      source,
      source_id: (normalized.external_id as string) ?? null,
      staging_record_id: staging.id,
      project_id: normalized.project_id,
      sector_id: normalized.sector_id ?? null,
      category: normalized.category ?? "realisation",
      type: normalized.type ?? "Non spécifié",
      name: normalized.name ?? "Sans nom",
      description: normalized.description ?? null,
      admin_zone_id: normalized.admin_zone_id ?? null,
      geom,
      date: normalized.date ?? null,
      status: normalized.status ?? "termine",
      beneficiaries_total: normalized.beneficiaries_total ? Number(normalized.beneficiaries_total) : null,
      validation_status: "validated",
      created_by: userId,
      last_updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !intervention) return { error: error?.message ?? "Impossible de créer la réalisation." };

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
