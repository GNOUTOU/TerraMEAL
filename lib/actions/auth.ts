"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) return { error: "Veuillez renseigner votre e-mail et votre mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Identifiants incorrects. Veuillez réessayer." };

  await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq(
    "id",
    (await supabase.auth.getUser()).data.user?.id ?? ""
  );

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Veuillez renseigner votre e-mail." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/update-password`,
  });

  if (error) return { error: "Impossible d'envoyer l'e-mail de récupération." };
  return { success: true };
}

export async function updatePassword(_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Impossible de mettre à jour le mot de passe." };
  return { success: true };
}
