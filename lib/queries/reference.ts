import { createClient } from "@/lib/supabase/server";

export async function getReferenceData() {
  const supabase = await createClient();
  const [{ data: sectors }, { data: zones }, { data: partners }, { data: donors }, { data: managers }] = await Promise.all([
    supabase.from("sectors").select("id, name, color").eq("active", true).order("name"),
    supabase.from("admin_zones").select("id, name, level").order("level").order("name"),
    supabase.from("partners").select("id, name").eq("active", true).order("name"),
    supabase.from("donors").select("id, name").eq("active", true).order("name"),
    supabase.from("profiles").select("id, full_name, role").in("role", ["admin", "meal_sig", "program_manager"]).order("full_name"),
  ]);
  return {
    sectors: sectors ?? [],
    zones: zones ?? [],
    partners: partners ?? [],
    donors: donors ?? [],
    managers: managers ?? [],
  };
}
