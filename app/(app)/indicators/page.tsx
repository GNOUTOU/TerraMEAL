import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Gauge } from "lucide-react";
import type { Indicator } from "@/lib/types";
import IndicatorsTable from "./IndicatorsTable";

export default async function IndicatorsPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [{ data: indicators }, { data: sectors }] = await Promise.all([
    supabase.from("indicators").select("*, sectors(name)").order("code"),
    supabase.from("sectors").select("id, name").eq("active", true).order("name"),
  ]);

  const canWrite = canWriteOperationalData(profile.role);
  const rows = (indicators as (Indicator & { sectors: { name: string } | null })[]) ?? [];

  return (
    <div>
      <PageHeader title="Indicateurs" description="Référentiel d'indicateurs : définitions, cibles et méthodes de calcul." icon={Gauge} />
      <IndicatorsTable rows={rows as unknown as (Indicator & Record<string, unknown> & { sectors: { name: string } | null })[]} sectors={sectors ?? []} canWrite={canWrite} />
    </div>
  );
}
