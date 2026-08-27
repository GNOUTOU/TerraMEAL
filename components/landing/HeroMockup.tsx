import { FolderKanban, MapPinned, Users, Search, Bell } from "lucide-react";

const PINS = [
  { top: "28%", left: "22%", color: "#2563eb" },
  { top: "44%", left: "38%", color: "#16a34a" },
  { top: "62%", left: "28%", color: "#dc2626" },
  { top: "35%", left: "58%", color: "#f97316" },
  { top: "58%", left: "68%", color: "#2563eb" },
  { top: "72%", left: "52%", color: "#16a34a" },
  { top: "22%", left: "72%", color: "#dc2626" },
];

const BARS = [38, 62, 45, 80, 54, 90, 66];

// Aperçu illustratif de l'interface (données d'exemple) — pas une capture d'écran réelle.
export default function HeroMockup() {
  return (
    <div className="relative w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] text-slate-400 dark:bg-slate-800">
          <Search size={11} /> terrameal.app/dashboard
        </div>
        <Bell size={13} className="text-slate-300 dark:text-slate-600" />
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2.5">
          <MockKpi icon={FolderKanban} label="Projets actifs" value="12" color="#059669" />
          <MockKpi icon={MapPinned} label="Réalisations" value="248" color="#2563eb" />
          <MockKpi icon={Users} label="Bénéficiaires" value="84,5k" color="#7c3aed" />
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          <div className="relative col-span-3 h-40 overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 dark:border-slate-800 dark:from-slate-800 dark:to-slate-900">
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: "radial-gradient(circle, rgb(100 116 139 / 0.4) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            />
            {PINS.map((p, i) => (
              <span
                key={i}
                className="absolute h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm dark:border-slate-900"
                style={{ top: p.top, left: p.left, backgroundColor: p.color }}
              />
            ))}
            <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 shadow-sm dark:bg-slate-900/90 dark:text-slate-400">
              Carte des interventions
            </span>
          </div>

          <div className="col-span-2 flex h-40 flex-col justify-between rounded-xl border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">Par secteur</span>
            <div className="flex h-24 items-end gap-1.5">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40">
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Qualité des données</span>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">98% validées</span>
        </div>
      </div>
    </div>
  );
}

function MockKpi({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${color}1a`, color }}>
        <Icon size={13} />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="truncate text-[9px] text-slate-400">{label}</p>
    </div>
  );
}
