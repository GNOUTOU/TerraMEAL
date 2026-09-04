"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { fetchKoboSubmissions, extractKoboCoordinates, type KoboConfig } from "@/lib/connectors/kobo";
import { fetchMwaterRecords, extractMwaterCoordinates, type MwaterConfig } from "@/lib/connectors/mwater";
import { normalizeImportRow } from "@/lib/import/normalize";

type Client = Awaited<ReturnType<typeof createClient>>;

interface NormalizedRow {
  name?: string;
  type?: string;
  category?: string;
  date?: string;
  lat?: number | null;
  lng?: number | null;
  beneficiaries_total?: number;
  external_id?: string;
  [key: string]: unknown;
}

async function createBatchWithRecords(
  supabase: Client,
  opts: {
    source: string;
    source_name: string;
    data_source_id?: string | null;
    file_name?: string | null;
    target_entity: string;
    triggered_by: string;
  },
  records: { external_id: string | null; payload: Record<string, unknown>; normalized: NormalizedRow }[]
) {
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      source: opts.source,
      source_name: opts.source_name,
      data_source_id: opts.data_source_id ?? null,
      file_name: opts.file_name ?? null,
      target_entity: opts.target_entity,
      status: "processing",
      records_total: records.length,
      triggered_by: opts.triggered_by,
    })
    .select("id")
    .single();

  if (batchError || !batch) throw new Error(batchError?.message ?? "Impossible de créer le lot d'import.");

  let success = 0;
  const errors: { external_id: string | null; message: string }[] = [];

  for (const record of records) {
    const { data: raw, error: rawError } = await supabase
      .from("raw_records")
      .insert({
        source: opts.source,
        source_ref: opts.source_name,
        import_batch_id: batch.id,
        external_id: record.external_id,
        payload: record.payload,
      })
      .select("id")
      .single();

    if (rawError || !raw) {
      errors.push({ external_id: record.external_id, message: rawError?.message ?? "Erreur d'insertion RAW." });
      continue;
    }

    const { error: stagingError } = await supabase.from("staging_records").insert({
      raw_record_id: raw.id,
      import_batch_id: batch.id,
      target_entity: opts.target_entity,
      normalized: record.normalized,
      validation_status: "to_verify",
    });

    if (stagingError) errors.push({ external_id: record.external_id, message: stagingError.message });
    else success += 1;
  }

  await supabase
    .from("import_batches")
    .update({
      status: errors.length === 0 ? "completed" : success > 0 ? "completed_with_errors" : "failed",
      records_success: success,
      records_error: errors.length,
      error_log: errors,
      finished_at: new Date().toISOString(),
    })
    .eq("id", batch.id);

  return { batchId: batch.id as string, success, errors: errors.length };
}

export async function syncKoboSource(dataSourceId: string) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();

  const { data: source } = await supabase.from("data_sources").select("*").eq("id", dataSourceId).single();
  if (!source) return { error: "Source introuvable." };

  const config = source.config as unknown as KoboConfig & { default_project_id?: string; default_sector_id?: string; default_category?: string };
  if (!config.base_url || !config.api_token || !config.asset_uid) {
    return { error: "Configuration Kobo incomplète (base_url, api_token, asset_uid requis)." };
  }

  try {
    const submissions = await fetchKoboSubmissions(config, source.sync_cursor ?? undefined);
    const mapping = (source.field_mapping as Record<string, string>) ?? {};

    const records = submissions.map((s) => {
      const { lat, lng } = extractKoboCoordinates(s);
      const normalized: NormalizedRow = {
        external_id: String(s._id),
        date: (s._submission_time as string) ?? undefined,
        lat,
        lng,
        project_id: config.default_project_id,
        sector_id: config.default_sector_id,
        category: config.default_category ?? "realisation",
      };
      for (const [koboField, terraField] of Object.entries(mapping)) {
        normalized[terraField] = s[koboField];
      }
      return { external_id: String(s._id), payload: s as Record<string, unknown>, normalized };
    });

    const result = await createBatchWithRecords(
      supabase,
      { source: "kobo", source_name: source.name, data_source_id: source.id, target_entity: "intervention", triggered_by: userId },
      records
    );

    await supabase
      .from("data_sources")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: `${result.success} enregistrement(s) importé(s), ${result.errors} erreur(s)`,
        sync_cursor: new Date().toISOString(),
      })
      .eq("id", dataSourceId);

    revalidatePath("/import");
    revalidatePath("/import/review");
    return { ...result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de synchronisation Kobo.";
    await supabase.from("data_sources").update({ last_sync_at: new Date().toISOString(), last_sync_status: `Échec : ${message}` }).eq("id", dataSourceId);
    return { error: message };
  }
}

export async function syncMwaterSource(dataSourceId: string) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();

  const { data: source } = await supabase.from("data_sources").select("*").eq("id", dataSourceId).single();
  if (!source) return { error: "Source introuvable." };

  const config = source.config as unknown as MwaterConfig & { default_project_id?: string; default_sector_id?: string; default_category?: string };
  if (!config.base_url || !config.api_token || !config.dataset_id) {
    return { error: "Configuration mWater incomplète (base_url, api_token, dataset_id requis)." };
  }

  try {
    const items = await fetchMwaterRecords(config);
    const mapping = (source.field_mapping as Record<string, string>) ?? {};

    const records = items.map((r) => {
      const { lat, lng } = extractMwaterCoordinates(r);
      const normalized: NormalizedRow = {
        external_id: String(r._id),
        lat,
        lng,
        project_id: config.default_project_id,
        sector_id: config.default_sector_id,
        category: config.default_category ?? "infrastructure",
      };
      for (const [mwField, terraField] of Object.entries(mapping)) {
        normalized[terraField] = r[mwField];
      }
      return { external_id: String(r._id), payload: r as Record<string, unknown>, normalized };
    });

    const result = await createBatchWithRecords(
      supabase,
      { source: "mwater", source_name: source.name, data_source_id: source.id, target_entity: "intervention", triggered_by: userId },
      records
    );

    await supabase
      .from("data_sources")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: `${result.success} enregistrement(s) importé(s), ${result.errors} erreur(s)`,
      })
      .eq("id", dataSourceId);

    revalidatePath("/import");
    revalidatePath("/import/review");
    return { ...result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de synchronisation mWater.";
    await supabase.from("data_sources").update({ last_sync_at: new Date().toISOString(), last_sync_status: `Échec : ${message}` }).eq("id", dataSourceId);
    return { error: message };
  }
}

export async function submitFileImport(payload: {
  fileName: string;
  fileType: "csv" | "excel" | "geojson" | "kml";
  rows: Record<string, unknown>[];
  mapping: Record<string, string>; // colonne fichier -> champ TerraMEAL (ou "__extra")
  extraLabels?: Record<string, string>; // colonne fichier -> libellé lisible pour « Autres »
  defaultProjectId: string;
  defaultCategory: string;
}) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();

  if (payload.rows.length === 0) return { error: "Aucune ligne à importer." };
  if (!payload.defaultProjectId) return { error: "Veuillez sélectionner le projet cible." };

  const extraLabels = payload.extraLabels ?? {};
  const idColumn = Object.entries(payload.mapping).find(([, t]) => t === "external_id")?.[0];

  const records = payload.rows.map((row, idx) => {
    const { normalized: n } = normalizeImportRow(row, payload.mapping, extraLabels);
    const normalized: NormalizedRow = {
      ...n,
      external_id: (n.external_id as string) ?? (idColumn ? String(row[idColumn] ?? `row-${idx}`) : `row-${idx}`),
      project_id: payload.defaultProjectId,
      category: (n.category as string) ?? payload.defaultCategory,
    };
    return { external_id: normalized.external_id ?? null, payload: row, normalized };
  });

  const result = await createBatchWithRecords(
    supabase,
    { source: payload.fileType === "excel" ? "excel" : payload.fileType, source_name: payload.fileName, file_name: payload.fileName, target_entity: "intervention", triggered_by: userId },
    records
  );

  revalidatePath("/import");
  revalidatePath("/import/review");
  return { ...result };
}
