import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: string; // lucide-react icon name, resolved in Sidebar.tsx
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: "LayoutDashboard", roles: ["admin", "meal_sig", "program_manager", "direction", "donor", "partner"] },
  { href: "/map", label: "Carte (WebGIS)", icon: "Map", roles: ["admin", "meal_sig", "program_manager", "direction", "donor", "partner"] },
  { href: "/projects", label: "Projets", icon: "FolderKanban", roles: ["admin", "meal_sig", "program_manager", "direction", "donor", "partner"] },
  { href: "/interventions", label: "Interventions", icon: "MapPinned", roles: ["admin", "meal_sig", "program_manager", "direction"] },
  { href: "/indicators", label: "Indicateurs", icon: "Gauge", roles: ["admin", "meal_sig", "program_manager", "direction", "donor"] },
  { href: "/import", label: "Import / Synchronisation", icon: "UploadCloud", roles: ["admin", "meal_sig"] },
  { href: "/quality", label: "Qualité des données", icon: "ShieldCheck", roles: ["admin", "meal_sig"] },
  { href: "/donor", label: "Vue Bailleur", icon: "HandCoins", roles: ["admin", "meal_sig", "donor"] },
  { href: "/admin", label: "Administration", icon: "Settings", roles: ["admin"] },
];
