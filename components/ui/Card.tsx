import type { LucideIcon } from "lucide-react";

export function Card({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

const ICON_COLORS = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  slate: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
} as const;

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  color = "emerald",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  color?: keyof typeof ICON_COLORS;
}) {
  return (
    <Card className="group flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {Icon && (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${ICON_COLORS[color]}`}
        >
          <Icon size={19} strokeWidth={2} />
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</span>
        {hint && <span className="truncate text-xs text-slate-400">{hint}</span>}
      </div>
    </Card>
  );
}
