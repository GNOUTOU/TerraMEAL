"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireUser } from "@/lib/auth";
import { runQualityChecks } from "@/lib/quality/rules";

interface InterventionInput {
  project_id: string;
  sector_id: string | null;
  subsector_id: string | null;
  category: "infrastructure" | "activity" | "realisation";
  type: string;
  name: string;
  description: string | null;
  admin_zone_id: string | null;
  implementing_partner_id: string | null;
  date: string | null;
  status: string;
  beneficiaries_total: number | null;
  lat: number | null;
  lng: number | null;
  geom_geojson: string | null;
  // infrastructure
  infra_type: string | null;
  capacity: number | null;
  functional_status: string | null;
  // activity
  activity_type: string | null;
  participants_count: number | null;
  sessions_count: number | null;
  location_text: string | null;
}

function parseInput(formData: FormData): InterventionInput {
  const str = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? String(v) : null);
  const num = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? Number(v) : null);

  return {
    project_id: String(formData.get("project_id") || ""),
    sector_id: str(formData.get("sector_id")),
    subsector_id: str(formData.get("subsector_id")),
    category: (str(formData.get("category")) as InterventionInput["category"]) ?? "realisation",
    type: String(formData.get("type") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    description: str(formData.get("description")),
    admin_zone_id: str(formData.get("admin_zone_id")),
    implementing_partner_id: str(formData.get("implementing_partner_id")),
    date: str(formData.get("date")),
    status: String(formData.get("status") || "planifie"),
    beneficiaries_total: num(formData.get("beneficiaries_total")),
    lat: num(formData.get("lat")),
    lng: num(formData.get("lng")),
    geom_geojson: str(formData.get("geom_geojson")),
    infra_type: str(formData.get("infra_type")),
    capacity: num(formData.get("capacity")),
    functional_status: str(formData.get("functional_status")),
    activity_type: str(formData.get("activity_type")),
    participants_count: num(formData.get("participants_count")),
    sessions_count: num(formData.get("sessions_count")),
    location_text: str(formData.get("location_text")),
  };
}

// Convertit une géométrie ligne/polygone dessinée sur la carte (GeometryDrawMap) en EWKT, dans
// le même format texte que le Point issu des champs latitude/longitude (SRID=4326;<WKT>), pour
// que l'insertion Supabase suive exactement le même chemin de cast implicite côté PostGIS.
function geojsonToEwkt(raw: string | null): string | null {
  if (!raw) return null;
  let geometry: { type: string; coordinates: unknown };
  try {
    geometry = JSON.parse(raw);
  } catch {
    return null;
  }
  const coordsToPairs = (coords: [number, number][]) => coords.map(([x, y]) => `${x} ${y}`).join(", ");
  if (geometry.type === "LineString") {
    const coords = geometry.coordinates as [number, number][];
    if (coords.length < 2) return null;
    return `SRID=4326;LINESTRING(${coordsToPairs(coords)})`;
  }
  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates as [number, number][][];
    if (!rings[0] || rings[0].length < 4) return null;
    return `SRID=4326;POLYGON((${coordsToPairs(rings[0])}))`;
  }
  return null;
}

function resolveGeom(input: Pick<InterventionInput, "lat" | "lng" | "geom_geojson">): string | null {
  return geojsonToEwkt(input.geom_geojson) ?? (input.lat != null && input.lng != null ? `SRID=4326;POINT(${input.lng} ${input.lat})` : null);
}

export async function createIntervention(formData: FormData) {
  const { userId } = await requireRole(["admin", "meal_sig", "program_manager"]);
  const input = parseInput(formData);
  if (!input.project_id || !input.name || !input.type) return { error: "Projet, nom et type sont obligatoires." };

  const supabase = await createClient();
  const geom = resolveGeom(input);

  const { data, error } = await supabase
    .from("interventions")
    .insert({
      project_id: input.project_id,
      sector_id: input.sector_id,
      subsector_id: input.subsector_id,
      category: input.category,
      type: input.type,
      name: input.name,
      description: input.description,
      admin_zone_id: input.admin_zone_id,
      implementing_partner_id: input.implementing_partner_id,
      geom,
      date: input.date,
      status: input.status,
      beneficiaries_total: input.beneficiaries_total,
      source: "manual",
      validation_status: "to_verify",
      created_by: userId,
      last_updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Création impossible." };

  if (input.category === "infrastructure" && input.infra_type) {
    await supabase.from("infrastructures").insert({
      intervention_id: data.id,
      infra_type: input.infra_type,
      capacity: input.capacity,
      functional_status: input.functional_status ?? "functional",
    });
  }
  if (input.category === "activity" && input.activity_type) {
    await supabase.from("activities").insert({
      intervention_id: data.id,
      activity_type: input.activity_type,
      participants_count: input.participants_count,
      sessions_count: input.sessions_count,
      location_text: input.location_text,
    });
  }

  await runQualityChecks({ interventionId: data.id, source: "manual" });

  revalidatePath("/interventions");
  redirect(`/interventions/${data.id}`);
}

export async function updateIntervention(id: string, formData: FormData) {
  await requireRole(["admin", "meal_sig", "program_manager"]);
  const input = parseInput(formData);
  if (!input.project_id || !input.name || !input.type) return { error: "Projet, nom et type sont obligatoires." };

  const supabase = await createClient();
  const geom = resolveGeom(input);

  const { error } = await supabase
    .from("interventions")
    .update({
      project_id: input.project_id,
      sector_id: input.sector_id,
      subsector_id: input.subsector_id,
      category: input.category,
      type: input.type,
      name: input.name,
      description: input.description,
      admin_zone_id: input.admin_zone_id,
      implementing_partner_id: input.implementing_partner_id,
      geom,
      date: input.date,
      status: input.status,
      beneficiaries_total: input.beneficiaries_total,
      last_updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (input.category === "infrastructure" && input.infra_type) {
    await supabase.from("infrastructures").upsert({
      intervention_id: id,
      infra_type: input.infra_type,
      capacity: input.capacity,
      functional_status: input.functional_status ?? "functional",
    });
  }
  if (input.category === "activity" && input.activity_type) {
    await supabase.from("activities").upsert({
      intervention_id: id,
      activity_type: input.activity_type,
      participants_count: input.participants_count,
      sessions_count: input.sessions_count,
      location_text: input.location_text,
    });
  }

  await runQualityChecks({ interventionId: id, source: "manual" });

  revalidatePath(`/interventions/${id}`);
  revalidatePath("/interventions");
  return { success: true };
}

export async function setValidationStatus(id: string, status: string, rejectionReason?: string) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("interventions")
    .update({ validation_status: status, rejection_reason: rejectionReason ?? null, last_updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("activity_log").insert({
    user_id: userId,
    action: status === "published" ? "publish" : "update",
    entity_table: "interventions",
    entity_id: id,
    new_value: { validation_status: status },
    validation_status: status,
  });

  revalidatePath(`/interventions/${id}`);
  revalidatePath("/quality");
  return { success: true };
}

export async function deleteIntervention(id: string) {
  await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const { error } = await supabase.from("interventions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/interventions");
  return { success: true };
}

export async function addBeneficiaryBreakdown(interventionId: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const sex = String(formData.get("sex") || "") || null;
  const age_bracket = String(formData.get("age_bracket") || "") || null;
  const count = Number(formData.get("count") || 0);
  if (!count) return { error: "Le nombre de bénéficiaires est requis." };

  const { error } = await supabase.from("beneficiaries_breakdown").insert({ intervention_id: interventionId, sex, age_bracket, count });
  if (error) return { error: error.message };

  const { data: rows } = await supabase.from("beneficiaries_breakdown").select("count").eq("intervention_id", interventionId);
  const total = (rows ?? []).reduce((s, r) => s + r.count, 0);
  await supabase.from("interventions").update({ beneficiaries_total: total }).eq("id", interventionId);

  revalidatePath(`/interventions/${interventionId}`);
  return { success: true };
}
