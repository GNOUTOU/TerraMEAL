import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { LayoutDashboard, Building2, FolderKanban } from "lucide-react";
import type { DashboardFilters } from "@/lib/queries/dashboard";
import OperationalDashboard from "@/components/dashboard/OperationalDashboard";
import ExecutiveDashboard from "@/components/dashboard/ExecutiveDashboard";
import ProgramManagerDashboard from "@/components/dashboard/ProgramManagerDashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireUser();

  // Bailleurs et partenaires ont une vue dédiée, export en avant — c'est leur véritable tableau
  // de bord, pas un module secondaire à découvrir.
  if (profile.role === "donor" || profile.role === "partner") redirect("/donor");

  const sp = await searchParams;
  const filters: DashboardFilters = { project: sp.project, sector: sp.sector, donor: sp.donor, year: sp.year, zone: sp.zone };
  const firstName = profile.full_name.split(" ")[0];

  if (profile.role === "direction") {
    return (
      <div>
        <PageHeader title="Vue exécutive" description="Portefeuille institutionnel — santé, tendances et comparatif des projets." icon={Building2} />
        <ExecutiveDashboard filters={filters} />
      </div>
    );
  }

  if (profile.role === "program_manager") {
    return (
      <div>
        <PageHeader title={`Bonjour, ${firstName}`} description="Vos projets, réalisations et indicateurs." icon={FolderKanban} />
        <ProgramManagerDashboard filters={filters} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Bonjour, ${firstName}`} description="Vue d'ensemble du portefeuille de projets et des réalisations." icon={LayoutDashboard} />
      <OperationalDashboard filters={filters} />
    </div>
  );
}
