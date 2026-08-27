import { createClient } from "@/lib/supabase/server";
import type { AdminZone } from "@/lib/types";
import { Info } from "lucide-react";
import ZonesTable from "./ZonesTable";

export default async function ZonesAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("admin_zones").select("*").order("level").order("name");
  const zones = (data as AdminZone[]) ?? [];

  return (
    <div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          La géométrie (polygones) des zones s&apos;importe via un fichier GeoJSON dans le module Import. Cette page gère la
          hiérarchie administrative (pays → région → province → commune → localité).
        </span>
      </p>
      <ZonesTable zones={zones} />
    </div>
  );
}
