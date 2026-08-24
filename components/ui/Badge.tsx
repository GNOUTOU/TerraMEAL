import type { AnomalySeverity, ProjectStatus, ValidationStatus } from "@/lib/types";
import { PROJECT_STATUS_LABELS, VALIDATION_STATUS_LABELS, ANOMALY_SEVERITY_LABELS } from "@/lib/types";

const COLORS: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
};

export function Badge({ color = "slate", children }: { color?: keyof typeof COLORS; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[color]}`}>
      {children}
    </span>
  );
}

const PROJECT_STATUS_COLOR: Record<ProjectStatus, keyof typeof COLORS> = {
  preparation: "blue",
  active: "emerald",
  suspended: "amber",
  closed: "slate",
  archived: "slate",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge color={PROJECT_STATUS_COLOR[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>;
}

const VALIDATION_COLOR: Record<ValidationStatus, keyof typeof COLORS> = {
  imported: "slate",
  to_verify: "amber",
  validated: "blue",
  published: "emerald",
  archived: "slate",
  rejected: "red",
};

export function ValidationStatusBadge({ status }: { status: ValidationStatus }) {
  return <Badge color={VALIDATION_COLOR[status]}>{VALIDATION_STATUS_LABELS[status]}</Badge>;
}

const SEVERITY_COLOR: Record<AnomalySeverity, keyof typeof COLORS> = {
  info: "blue",
  warning: "amber",
  blocking: "red",
};

export function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  return <Badge color={SEVERITY_COLOR[severity]}>{ANOMALY_SEVERITY_LABELS[severity]}</Badge>;
}
