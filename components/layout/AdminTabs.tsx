"use client";

import TabNav from "@/components/ui/TabNav";
import { Users, HandCoins, Handshake, Layers, MapPinned, Plug, SlidersHorizontal, ScrollText } from "lucide-react";

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

export default function AdminTabs() {
  return <TabNav tabs={TABS} />;
}
