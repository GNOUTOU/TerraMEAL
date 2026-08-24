"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Actions CRUD génériques pour les référentiels (bailleurs, partenaires, secteurs, zones,
// sources, paramètres...). La sécurité est déléguée entièrement à Postgres RLS : ces actions
// n'effectuent AUCUNE vérification de rôle elles-mêmes — si la policy refuse, Supabase renvoie
// une erreur et rien n'est écrit. Ne pas réutiliser pour des tables sans policy d'écriture stricte.
// "profiles" is deliberately excluded: role/is_active/donor_id/partner_id changes must go
// through lib/actions/users.ts (admin service-role client — see migration 0013 for why a
// generic RLS-gated update is not sufficient to prevent self-promotion).
const ALLOWED_TABLES = new Set([
  "donors", "partners", "sectors", "subsectors", "admin_zones", "data_sources",
  "app_settings", "indicators", "indicator_results",
]);

function assertAllowed(table: string) {
  if (!ALLOWED_TABLES.has(table)) throw new Error(`Table "${table}" non autorisée pour crud générique.`);
}

export async function crudInsert(table: string, values: Record<string, unknown>, revalidate?: string) {
  assertAllowed(table);
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert(values);
  if (error) return { error: error.message };
  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}

export async function crudUpdate(table: string, id: string, values: Record<string, unknown>, revalidate?: string, idKey = "id") {
  assertAllowed(table);
  const supabase = await createClient();
  const { error } = await supabase.from(table).update(values).eq(idKey, id);
  if (error) return { error: error.message };
  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}

export async function crudDelete(table: string, id: string, revalidate?: string, idKey = "id") {
  assertAllowed(table);
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq(idKey, id);
  if (error) return { error: error.message };
  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}
