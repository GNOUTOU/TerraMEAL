"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { VisibilityLevel } from "@/lib/types";

export async function uploadDocument(formData: FormData) {
  const { userId } = await requireUser();
  const file = formData.get("file") as File | null;
  const entity_table = String(formData.get("entity_table") || "");
  const entity_id = String(formData.get("entity_id") || "");
  const name = String(formData.get("name") || file?.name || "document");
  const visibility_level = String(formData.get("visibility_level") || "restricted") as VisibilityLevel;
  const description = String(formData.get("description") || "") || null;
  const revalidate = String(formData.get("revalidate") || "");

  if (!file || file.size === 0) return { error: "Veuillez sélectionner un fichier." };
  if (!entity_table || !entity_id) return { error: "Entité cible manquante." };

  const supabase = await createClient();
  const path = `${entity_table}/${entity_id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("documents").insert({
    entity_table,
    entity_id,
    name,
    file_path: path,
    file_type: file.type,
    visibility_level,
    description,
    uploaded_by: userId,
  });
  if (insertError) return { error: insertError.message };

  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}

export async function getDocumentUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function deleteDocument(id: string, filePath: string, revalidate?: string) {
  const supabase = await createClient();
  await supabase.storage.from("documents").remove([filePath]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: error.message };
  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}
