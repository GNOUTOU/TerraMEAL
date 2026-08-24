"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

export async function createUserAction(formData: FormData) {
  await requireRole(["admin"]);

  const email = String(formData.get("email") || "").trim();
  const full_name = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "meal_sig") as UserRole;
  const organization = String(formData.get("organization") || "") || null;
  const donor_id = String(formData.get("donor_id") || "") || null;
  const partner_id = String(formData.get("partner_id") || "") || null;
  const temp_password = String(formData.get("temp_password") || "");

  if (!email || !full_name || temp_password.length < 8) {
    return { error: "E-mail, nom complet et mot de passe temporaire (8 caractères min.) sont requis." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error || !data.user) return { error: error?.message ?? "Création impossible." };

  // Le trigger handle_new_user crée déjà le profil (rôle par défaut meal_sig) ; on l'ajuste ici.
  const { error: updateError } = await admin
    .from("profiles")
    .update({ role, organization, donor_id, partner_id })
    .eq("id", data.user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserAction(id: string, values: Record<string, unknown>) {
  // requireRole checks the *caller's* role via the RLS-bound client; the actual write below
  // uses the admin (service_role) client because it touches columns (role/is_active/
  // donor_id/partner_id) that are revoked from "authenticated" at the column level (0013) —
  // a normal user must never be able to self-promote by editing their own profile row.
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deactivateUserAction(id: string, active: boolean) {
  return updateUserAction(id, { is_active: active });
}
