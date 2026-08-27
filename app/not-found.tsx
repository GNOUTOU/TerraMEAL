import Link from "next/link";
import { MapPinOff, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center dark:bg-slate-950">
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <MapPinOff size={26} strokeWidth={1.75} />
      </div>
      <p className="text-5xl font-bold text-slate-300 dark:text-slate-700">404</p>
      <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Page introuvable</h1>
      <p className="max-w-sm text-sm text-slate-500">Cette ressource n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
      <Link href="/dashboard" className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
        <LayoutDashboard size={15} /> Retour au tableau de bord
      </Link>
    </div>
  );
}
