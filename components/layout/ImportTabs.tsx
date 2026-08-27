"use client";

import TabNav from "@/components/ui/TabNav";
import { FileSpreadsheet, Smartphone, Droplets, ListChecks, History } from "lucide-react";

const TABS = [
  { href: "/import/files", label: "Fichiers (CSV/Excel/GeoJSON)", icon: FileSpreadsheet },
  { href: "/import/kobo", label: "KoboToolbox", icon: Smartphone },
  { href: "/import/mwater", label: "mWater", icon: Droplets },
  { href: "/import/review", label: "Revue STAGING", icon: ListChecks },
  { href: "/import/history", label: "Historique", icon: History },
];

export default function ImportTabs() {
  return <TabNav tabs={TABS} />;
}
