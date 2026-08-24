import { createClient } from "@/lib/supabase/server";
import { Card, KpiCard } from "@/components/ui/Card";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import MapView from "@/components/map/MapView";
import { interventionsToFeatureCollection } from "@/lib/geo";

export default async function PublicPortalPage() {
  const supabase = await createClient();

  const { data: setting } = await supabase.from("app_settings").select("value").eq("key", "public_portal_enabled").maybeSingle();
  const enabled = setting?.value === true;

  if (!enabled) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Portail public non activé</h1>
        <p className="text-sm text-slate-500">
          Le portail public de TerraMEAL n&apos;est pas encore activé par l&apos;organisation. Revenez plus tard ou
          connectez-vous si vous disposez d&apos;un compte.
        </p>
      </Card>
    );
  }

  const [{ data: projects }, { data: interventions }, { data: orgName }] = await Promise.all([
    supabase.from("projects").select("id, name, status, start_date, end_date").in("status", ["active", "closed"]),
    supabase.from("interventions_geo").select("*").eq("validation_status", "published").eq("sensitivity_level", 1),
    supabase.from("app_settings").select("value").eq("key", "org_name").maybeSingle(),
  ]);

  const beneficiariesTotal = (interventions ?? []).reduce((s, i) => s + (i.beneficiaries_total ?? 0), 0);
  const features = interventionsToFeatureCollection((interventions ?? []) as never[]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{String(orgName?.value ?? "TerraMEAL")}</h1>
        <p className="mt-1 text-sm text-slate-500">Où intervenons-nous ? Quelles réalisations avons-nous menées ?</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard label="Projets" value={projects?.length ?? 0} />
        <KpiCard label="Réalisations publiées" value={interventions?.length ?? 0} />
        <KpiCard label="Bénéficiaires (agrégés)" value={beneficiariesTotal.toLocaleString("fr-FR")} />
      </div>

      <Card className="mb-6">
        <div style={{ height: 420 }}>
          <MapView points={features} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Projets en cours</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {(projects ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
              <span className="text-sm text-slate-700 dark:text-slate-200">{p.name}</span>
              <ProjectStatusBadge status={p.status as never} />
            </div>
          ))}
          {(projects?.length ?? 0) === 0 && <p className="text-sm text-slate-400">Aucun projet publié pour le moment.</p>}
        </div>
      </Card>
    </div>
  );
}
