import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

// À utiliser dans les Server Components/Actions protégés : renvoie l'utilisateur + son profil
// TerraMEAL, ou redirige vers /login si non authentifié.
export async function requireUser(): Promise<{ userId: string; profile: Profile }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) redirect("/login");
  if (!(profile as Profile).is_active) redirect("/login?error=inactive");

  return { userId: user.id, profile: profile as Profile };
}

export async function requireRole(roles: UserRole[]): Promise<{ userId: string; profile: Profile }> {
  const ctx = await requireUser();
  if (!roles.includes(ctx.profile.role)) redirect("/dashboard?error=forbidden");
  return ctx;
}

export function canWriteOperationalData(role: UserRole) {
  return role === "admin" || role === "meal_sig" || role === "program_manager";
}

export function isInternalRole(role: UserRole) {
  return role === "admin" || role === "meal_sig" || role === "direction" || role === "program_manager";
}
