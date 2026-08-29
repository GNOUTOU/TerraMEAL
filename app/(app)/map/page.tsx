import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import FilterBar from "@/components/ui/FilterBar";
import { getFilterOptions } from "@/lib/queries/dashboard";
import { interventionsToFeatureCollection, interventionsToLineAndPolygonFeatureCollection, zonesToFeatureCollection } from "@/lib/geo";
import MapView from "@/components/map/MapView";
import { Map } from "lucide-react";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("interventions_geo").select("*").in("validation_status", ["validated", "published"]);
  if (sp.project) query = query.eq("project_id", sp.project);
  if (sp.sector) query = query.eq("sector_id", sp.sector);
  if (sp.zone) query = query.eq("admin_zone_id", sp.zone);

  const [{ data: interventions }, { data: zones }, options, { data: sectors }] = await Promise.all([
    query,
    supabase.from("admin_zones_geo").select("*").in("level", ["region", "province"]),
    getFilterOptions(),
    supabase.from("sectors").select("id, name, color").eq("active", true).order("name"),
  ]);

  const points = interventionsToFeatureCollection((interventions ?? []) as never[]);
  const zonePolygons = zonesToFeatureCollection((zones ?? []) as never[]);
  const interventionShapes = interventionsToLineAndPolygonFeatureCollection((interventions ?? []) as never[]);
  const polygons = { ...zonePolygons, features: [...zonePolygons.features, ...interventionShapes.features] };
  const legend = (sectors ?? []).map((s) => ({ id: s.id, label: s.name, color: s.color }));

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Carte (WebGIS)" description="Visualisation cartographique de toutes les interventions validées et publiées." icon={Map} />

      <FilterBar
        filters={[
          { key: "project", label: "Tous les projets", options: options.projects.map((p) => ({ value: p.id, label: p.name })) },
          { key: "sector", label: "Tous les secteurs", options: options.sectors.map((s) => ({ value: s.id, label: s.name })) },
          { key: "zone", label: "Toutes les zones", options: options.zones.map((z) => ({ value: z.id, label: z.name })) },
        ]}
      />

      <div className="relative flex-1" style={{ minHeight: 500 }}>
        <MapView points={points} polygons={polygons} legend={legend} exportable tools />
        <p className="pointer-events-none absolute right-3 top-32 z-10 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-400 dark:bg-slate-900/90">
          {points.features.length} réalisation(s) affichée(s)
        </p>
      </div>
    </div>
  );
}
