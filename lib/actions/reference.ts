"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

// Création « éclair » des référentiels depuis les formulaires (projet, réalisation…) : l'utilisateur
// tape un nom qui n'existe pas encore et le crée sans quitter la page. La sécurité d'écriture reste
// portée par la RLS Postgres (`is_meal_or_admin()` sur donors/partners/sectors/admin_zones).

type RefKind = "donor" | "partner" | "sector" | "zone";

const TABLE: Record<RefKind, string> = {
  donor: "donors",
  partner: "partners",
  sector: "sectors",
  zone: "admin_zones",
};

const ZONE_LEVELS = ["country", "region", "province", "commune", "locality"] as const;

// Palette lisible en clair comme en sombre — piochée de façon déterministe d'après le nom pour
// éviter deux secteurs de couleur identique créés à la suite.
const SECTOR_COLORS = [
  "#2563eb", "#16a34a", "#db2777", "#d97706", "#7c3aed",
  "#0891b2", "#dc2626", "#4f46e5", "#059669", "#c026d3",
];

function slugCode(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return base ? `${base}-${suffix}` : `REF-${suffix}`;
}

export async function quickCreateReference(
  kind: RefKind,
  rawName: string,
  opts?: { level?: string }
): Promise<{ id: string; name: string } | { error: string }> {
  await requireRole(["admin", "meal_sig"]);

  const name = rawName.trim();
  if (!name) return { error: "Le nom est obligatoire." };
  if (name.length > 160) return { error: "Le nom est trop long (160 caractères maximum)." };

  const supabase = await createClient();
  const row: Record<string, unknown> = { name, code: slugCode(name) };

  if (kind === "zone") {
    const level =
      opts?.level && (ZONE_LEVELS as readonly string[]).includes(opts.level) ? opts.level : "commune";
    row.level = level;
  }
  if (kind === "sector") {
    const idx =
      Math.abs([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % SECTOR_COLORS.length;
    row.color = SECTOR_COLORS[idx];
  }

  const { data, error } = await supabase.from(TABLE[kind]).insert(row).select("id, name").single();
  if (error || !data) return { error: error?.message ?? "Création impossible." };

  revalidatePath("/projects");
  return { id: data.id as string, name: data.name as string };
}

// « Responsable » : contrairement aux référentiels, un responsable est un compte utilisateur réel.
// Réservé aux administrateurs (createUser exige le client service-role — cf. lib/actions/users.ts).
export async function quickCreateManager(input: {
  full_name: string;
  email: string;
  temp_password: string;
}): Promise<{ id: string; full_name: string } | { error: string }> {
  await requireRole(["admin"]);

  const full_name = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const temp_password = input.temp_password;

  if (!full_name || !email) return { error: "Nom complet et e-mail sont requis." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "L'adresse e-mail est invalide." };
  if (temp_password.length < 8)
    return { error: "Le mot de passe temporaire doit faire 8 caractères minimum." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error || !data.user) return { error: error?.message ?? "Création impossible." };

  // Le trigger handle_new_user a déjà créé le profil ; on force le rôle program_manager
  // pour qu'il apparaisse dans la liste des responsables.
  const { error: updateError } = await admin
    .from("profiles")
    .update({ role: "program_manager", full_name })
    .eq("id", data.user.id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/projects");
  revalidatePath("/admin/users");
  return { id: data.user.id, full_name };
}
