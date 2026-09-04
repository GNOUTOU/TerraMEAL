"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

interface ProjectInput {
  code: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  year: number | null;
  reporting_period: string | null;
  budget: number | null;
  currency: string | null;
  donor_principal_id: string | null;
  objectives: string | null;
  target_groups: string | null;
  sector_ids: string[];
  zone_ids: string[];
  partner_ids: string[];
  donor_ids: string[];
}

function parseInput(formData: FormData): ProjectInput {
  const num = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? Number(v) : null);
  const str = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? String(v) : null);

  return {
    code: String(formData.get("code") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    description: str(formData.get("description")),
    manager_id: str(formData.get("manager_id")),
    status: String(formData.get("status") || "preparation"),
    start_date: str(formData.get("start_date")),
    end_date: str(formData.get("end_date")),
    year: num(formData.get("year")),
    reporting_period: str(formData.get("reporting_period")),
    budget: num(formData.get("budget")),
    currency: str(formData.get("currency")) ?? "USD",
    donor_principal_id: str(formData.get("donor_principal_id")),
    objectives: str(formData.get("objectives")),
    target_groups: str(formData.get("target_groups")),
    sector_ids: formData.getAll("sector_ids").map(String),
    zone_ids: formData.getAll("zone_ids").map(String),
    partner_ids: formData.getAll("partner_ids").map(String),
    donor_ids: formData.getAll("donor_ids").map(String),
  };
}

async function syncJoinTable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  projectId: string,
  key: string,
  ids: string[]
) {
  await supabase.from(table).delete().eq("project_id", projectId);
  if (ids.length > 0) {
    await supabase.from(table).insert(ids.map((id) => ({ project_id: projectId, [key]: id })));
  }
}

export async function createProject(formData: FormData) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const input = parseInput(formData);
  if (!input.code || !input.name) return { error: "Le code et le nom du projet sont obligatoires." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      code: input.code,
      name: input.name,
      description: input.description,
      manager_id: input.manager_id,
      status: input.status,
      start_date: input.start_date,
      end_date: input.end_date,
      year: input.year,
      reporting_period: input.reporting_period,
      budget: input.budget,
      currency: input.currency,
      donor_principal_id: input.donor_principal_id,
      objectives: input.objectives,
      target_groups: input.target_groups,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Création impossible." };

  await Promise.all([
    syncJoinTable(supabase, "project_sectors", data.id, "sector_id", input.sector_ids),
    syncJoinTable(supabase, "project_zones", data.id, "admin_zone_id", input.zone_ids),
    syncJoinTable(supabase, "project_partners", data.id, "partner_id", input.partner_ids),
  ]);
  if (input.donor_ids.length > 0) {
    await supabase.from("project_donors").insert(
      input.donor_ids.map((donor_id) => ({ project_id: data.id, donor_id, is_principal: donor_id === input.donor_principal_id }))
    );
  }

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  await requireRole(["admin", "meal_sig", "program_manager"]);
  const input = parseInput(formData);
  if (!input.code || !input.name) return { error: "Le code et le nom du projet sont obligatoires." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      code: input.code,
      name: input.name,
      description: input.description,
      manager_id: input.manager_id,
      status: input.status,
      start_date: input.start_date,
      end_date: input.end_date,
      year: input.year,
      reporting_period: input.reporting_period,
      budget: input.budget,
      currency: input.currency,
      donor_principal_id: input.donor_principal_id,
      objectives: input.objectives,
      target_groups: input.target_groups,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await Promise.all([
    syncJoinTable(supabase, "project_sectors", id, "sector_id", input.sector_ids),
    syncJoinTable(supabase, "project_zones", id, "admin_zone_id", input.zone_ids),
    syncJoinTable(supabase, "project_partners", id, "partner_id", input.partner_ids),
  ]);
  await supabase.from("project_donors").delete().eq("project_id", id);
  if (input.donor_ids.length > 0) {
    await supabase.from("project_donors").insert(
      input.donor_ids.map((donor_id) => ({ project_id: id, donor_id, is_principal: donor_id === input.donor_principal_id }))
    );
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return { success: true };
}

export async function archiveProject(id: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  await supabase.from("projects").update({ status: "archived", is_archived: true }).eq("id", id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

// « Masquer » / « Afficher » : retire (ou remet) le projet de la liste principale sans le
// supprimer. Réversible depuis l'onglet « Masqués » de la page Projets.
export async function setProjectHidden(id: string, hidden: boolean) {
  await requireRole(["admin", "meal_sig", "program_manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ is_hidden: hidden }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

// « Supprimer » : envoie le projet dans la corbeille (suppression réversible). Rien n'est
// effacé — le projet peut être restauré ou supprimé définitivement par un administrateur.
export async function trashProject(id: string) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/projects/corbeille");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function restoreProject(id: string) {
  await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/projects/corbeille");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

// Suppression définitive depuis la corbeille — réservée aux administrateurs (RLS
// `projects_delete`). Les tables liées (project_donors, project_zones, interventions...)
// sont supprimées en cascade par les contraintes de clés étrangères.
export async function deleteProjectPermanently(id: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id).not("deleted_at", "is", null);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/projects/corbeille");
  return { success: true };
}
