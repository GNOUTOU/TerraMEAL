import { createClient } from "@/lib/supabase/server";
import type { Donor } from "@/lib/types";
import DonorsTable from "./DonorsTable";

export default async function DonorsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("donors").select("*").order("name");

  return <DonorsTable rows={(data as Donor[]) ?? []} />;
}
