import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import TabNav from "@/components/ui/TabNav";
import { Settings, Users, HandCoins, Handshake, Layers, MapPinned, Plug, SlidersHorizontal, ScrollText } from "lucide-react";

const TABS = [
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/donors", label: "Bailleurs", icon: HandCoins },
  { href: "/admin/partners", label: "Partenaires", icon: Handshake },
  { href: "/admin/sectors", label: "Secteurs", icon: Layers },
  { href: "/admin/zones", label: "Zones administratives", icon: MapPinned },
  { href: "/admin/sources", label: "Sources de données", icon: Plug },
  { href: "/admin/settings", label: "Paramètres", icon: SlidersHorizontal },
  { href: "/admin/logs", label: "Journal d'activité", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);

  return (
    <div>
      <PageHeader title="Administration" description="Utilisateurs, rôles, référentiels, sources et paramètres généraux." icon={Settings} />
      <TabNav tabs={TABS} />
      {children}
    </div>
  );
}
