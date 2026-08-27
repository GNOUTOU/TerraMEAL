import { createClient } from "@/lib/supabase/server";
import type { Partner } from "@/lib/types";
import PartnersTable from "./PartnersTable";

export default async function PartnersAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("partners").select("*").order("name");

  return <PartnersTable rows={(data as Partner[]) ?? []} />;
}
