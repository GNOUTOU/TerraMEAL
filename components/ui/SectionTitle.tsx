import type { LucideIcon } from "lucide-react";

export default function SectionTitle({
  icon: Icon,
  children,
  className = "mb-2",
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 ${className}`}>
      {Icon && <Icon size={15} className="text-slate-400" />}
      {children}
    </h2>
  );
}
