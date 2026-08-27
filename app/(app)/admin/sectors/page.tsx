import { createClient } from "@/lib/supabase/server";
import type { Sector } from "@/lib/types";
import SectorsTable from "./SectorsTable";

export default async function SectorsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sectors").select("*").order("name");

  return <SectorsTable rows={(data as Sector[]) ?? []} />;
}
