import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
        <Link href="/public" className="flex items-center gap-2">
          <Image src="/terrameal-mark.svg" alt="TerraMEAL" width={32} height={32} className="shrink-0" />
          <span className="text-lg font-semibold text-slate-900 dark:text-white">TerraMEAL</span>
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800">Portail public</span>
        </Link>
        <Link href="/login" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <LogIn size={15} /> Espace connecté
        </Link>
      </header>
      <main className="flex-1 p-4 md:p-8">{children}</main>
      <footer className="border-t border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
        TerraMEAL — La donnée spatiale au service de la redevabilité. Données publiées, agrégées et non sensibles uniquement.
      </footer>
    </div>
  );
}
