import { createClient } from "@/lib/supabase/server";
import UsersManager from "./UsersManager";
import type { Donor, Partner, Profile } from "@/lib/types";

export default async function UsersAdminPage() {
  const supabase = await createClient();
  const [{ data: users }, { data: donors }, { data: partners }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("donors").select("*").order("name"),
    supabase.from("partners").select("*").order("name"),
  ]);

  return (
    <UsersManager
      users={(users as Profile[]) ?? []}
      donors={(donors as Donor[]) ?? []}
      partners={(partners as Partner[]) ?? []}
    />
  );
}
