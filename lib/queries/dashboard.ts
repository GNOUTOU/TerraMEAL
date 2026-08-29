import { createClient } from "@/lib/supabase/server";
import type { DashboardKpis } from "@/lib/types";

export interface DashboardFilters {
  project?: string;
  sector?: string;
  donor?: string;
  year?: string;
  zone?: string;
}

export async function getDashboardKpis(f: DashboardFilters): Promise<DashboardKpis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_kpis", {
    p_project_id: f.project || null,
    p_sector_id: f.sector || null,
    p_donor_id: f.donor || null,
    p_year: f.year ? Number(f.year) : null,
    p_admin_zone_id: f.zone || null,
  });
  if (error || !data || data.length === 0) return null;
  return data[0] as DashboardKpis;
}

export async function getFilterOptions() {
  const supabase = await createClient();
  const [{ data: projects }, { data: sectors }, { data: donors }, { data: zones }, { data: partners }] = await Promise.all([
    supabase.from("projects").select("id, code, name").order("name"),
    supabase.from("sectors").select("id, name, color").eq("active", true).order("name"),
    supabase.from("donors").select("id, name").eq("active", true).order("name"),
    supabase.from("admin_zones").select("id, name, level").in("level", ["region", "province", "commune"]).order("name"),
    supabase.from("partners").select("id, name").eq("active", true).order("name"),
  ]);
  return {
    projects: projects ?? [],
    sectors: sectors ?? [],
    donors: donors ?? [],
    zones: zones ?? [],
    partners: partners ?? [],
  };
}

export async function getInterventionsBySector(f: DashboardFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("interventions")
    .select("sector_id, sectors(name, color)")
    .in("validation_status", ["validated", "published"]);
  if (f.project) query = query.eq("project_id", f.project);
  if (f.sector) query = query.eq("sector_id", f.sector);
  if (f.zone) query = query.eq("admin_zone_id", f.zone);
  const { data } = await query;
  const counts = new Map<string, { name: string; color: string; count: number }>();
  for (const row of (data as unknown as { sector_id: string | null; sectors: { name: string; color: string } | null }[]) ?? []) {
    if (!row.sector_id || !row.sectors) continue;
    const key = row.sector_id;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { name: row.sectors.name, color: row.sectors.color, count: 1 });
  }
  return Array.from(counts.values());
}

export async function getInterventionsByStatusAndYear(f: DashboardFilters) {
  const supabase = await createClient();
  let query = supabase.from("interventions").select("validation_status, date");
  if (f.project) query = query.eq("project_id", f.project);
  if (f.sector) query = query.eq("sector_id", f.sector);
  const { data } = await query;
  const byStatus = new Map<string, number>();
  const byYear = new Map<string, number>();
  for (const row of data ?? []) {
    byStatus.set(row.validation_status, (byStatus.get(row.validation_status) ?? 0) + 1);
    if (row.date) {
      const y = String(new Date(row.date).getFullYear());
      byYear.set(y, (byYear.get(y) ?? 0) + 1);
    }
  }
  return {
    byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
    byYear: Array.from(byYear.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([year, count]) => ({ year, count })),
  };
}

export async function getIndicatorPerformance() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("indicator_results_with_rate")
    .select("id, period, target_value, actual_value, achievement_rate, indicators(code, label)")
    .order("period", { ascending: false })
    .limit(8);
  return (data as unknown as {
    id: string; period: string; target_value: number | null; actual_value: number | null;
    achievement_rate: number | null; indicators: { code: string; label: string } | null;
  }[]) ?? [];
}

// Répartition du portefeuille par statut — vue exécutive (Direction). Les tables sont lues avec
// la session de l'utilisateur courant (RLS), donc un rôle scoping (ex: program_manager) obtient
// automatiquement une répartition limitée à son propre périmètre.
export async function getPortfolioByStatus() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("status");
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

// Classement des projets par bénéficiaires atteints — vue exécutive.
export async function getTopProjects(limit = 6) {
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("id, name, status").order("name");
  if (!projects || projects.length === 0) return [];

  const { data: interventions } = await supabase
    .from("interventions")
    .select("project_id, beneficiaries_total")
    .in("validation_status", ["validated", "published"]);

  const totals = new Map<string, number>();
  for (const row of interventions ?? []) {
    totals.set(row.project_id, (totals.get(row.project_id) ?? 0) + (row.beneficiaries_total ?? 0));
  }

  return projects
    .map((p) => ({ id: p.id, name: p.name, status: p.status, beneficiaries: totals.get(p.id) ?? 0 }))
    .sort((a, b) => b.beneficiaries - a.beneficiaries)
    .slice(0, limit);
}

// Projets accessibles à l'utilisateur courant (RLS) avec un mini-résumé — vue Responsable
// Programme ("Vos projets").
export async function getMyProjectsSummary() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("*").order("name");
  if (!projects || projects.length === 0) return [];

  const { data: interventions } = await supabase.from("interventions").select("project_id, beneficiaries_total, validation_status");

  const stats = new Map<string, { count: number; beneficiaries: number }>();
  for (const row of interventions ?? []) {
    const s = stats.get(row.project_id) ?? { count: 0, beneficiaries: 0 };
    if (row.validation_status === "validated" || row.validation_status === "published") {
      s.count += 1;
      s.beneficiaries += row.beneficiaries_total ?? 0;
    }
    stats.set(row.project_id, s);
  }

  return projects.map((p) => ({
    ...p,
    interventions_count: stats.get(p.id)?.count ?? 0,
    beneficiaries: stats.get(p.id)?.beneficiaries ?? 0,
  }));
}

// Alertes fraîcheur/synchronisation — Cahier des charges 18.4 / 25.6 : signale les réalisations
// non rafraîchies (vue stale_interventions) et les dernières synchronisations en échec.
export async function getDataFreshnessSummary() {
  const supabase = await createClient();
  const [{ count: staleCount }, { data: failedSources }] = await Promise.all([
    supabase.from("stale_interventions").select("*", { count: "exact", head: true }),
    supabase.from("data_sources").select("id, name, last_sync_status, last_sync_at").eq("active", true).ilike("last_sync_status", "Échec%"),
  ]);
  return {
    stale: staleCount ?? 0,
    failedSyncs: failedSources ?? [],
  };
}

// Analyse de couverture (15.6) — communes sans réalisation ou les moins couvertes, pour aider
// la Direction/le Responsable Programme à repérer les zones sous-desservies.
export async function getZoneCoverage(limit = 8) {
  const supabase = await createClient();
  const [{ data: communes }, { data: interventions }] = await Promise.all([
    supabase.from("admin_zones").select("id, name").eq("level", "commune").order("name"),
    supabase.from("interventions").select("admin_zone_id").in("validation_status", ["validated", "published"]),
  ]);
  if (!communes || communes.length === 0) return [];

  const counts = new Map<string, number>();
  for (const row of interventions ?? []) {
    if (!row.admin_zone_id) continue;
    counts.set(row.admin_zone_id, (counts.get(row.admin_zone_id) ?? 0) + 1);
  }

  return communes
    .map((z) => ({ id: z.id, name: z.name, count: counts.get(z.id) ?? 0 }))
    .sort((a, b) => a.count - b.count)
    .slice(0, limit);
}

export async function getQualityAlertsSummary() {
  const supabase = await createClient();
  const [{ count: openCount }, { count: blockingCount }, { data: byType }] = await Promise.all([
    supabase.from("anomalies").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("anomalies").select("*", { count: "exact", head: true }).eq("status", "open").eq("severity", "blocking"),
    supabase.from("anomalies").select("anomaly_type").eq("status", "open"),
  ]);
  const typeCounts = new Map<string, number>();
  for (const row of byType ?? []) {
    typeCounts.set(row.anomaly_type, (typeCounts.get(row.anomaly_type) ?? 0) + 1);
  }
  return {
    open: openCount ?? 0,
    blocking: blockingCount ?? 0,
    byType: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })),
  };
}
