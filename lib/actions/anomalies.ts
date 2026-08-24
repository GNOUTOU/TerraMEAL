"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function updateAnomalyStatus(id: string, status: string, comment?: string) {
  const { userId } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();

  const values: Record<string, unknown> = { status };
  if (comment) values.resolution_comment = comment;
  if (status === "corrected" || status === "closed" || status === "rejected") {
    values.resolved_at = new Date().toISOString();
    values.resolved_by = userId;
  }

  const { error } = await supabase.from("anomalies").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quality");
  revalidatePath(`/quality/${id}`);
  return { success: true };
}

export async function assignAnomaly(id: string, assigneeId: string | null) {
  await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const { error } = await supabase.from("anomalies").update({ assignee_id: assigneeId, status: "in_review" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/quality");
  revalidatePath(`/quality/${id}`);
  return { success: true };
}
