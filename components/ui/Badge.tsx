import {
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Archive,
  Upload,
  Eye,
  ShieldCheck,
  Globe2,
  XCircle,
  Info,
  AlertTriangle,
  AlertOctagon,
  type LucideIcon,
} from "lucide-react";
import type { AnomalySeverity, ProjectStatus, ValidationStatus } from "@/lib/types";
import { PROJECT_STATUS_LABELS, VALIDATION_STATUS_LABELS, ANOMALY_SEVERITY_LABELS } from "@/lib/types";

const COLORS = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
} as const;

export function Badge({
  color = "slate",
  icon: Icon,
  children,
}: {
  color?: keyof typeof COLORS;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[color]}`}>
      {Icon && <Icon size={12} strokeWidth={2.5} />}
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

const PROJECT_STATUS_ICON: Record<ProjectStatus, LucideIcon> = {
  preparation: Clock,
  active: PlayCircle,
  suspended: PauseCircle,
  closed: CheckCircle2,
  archived: Archive,
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge color={PROJECT_STATUS_COLOR[status]} icon={PROJECT_STATUS_ICON[status]}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

const VALIDATION_COLOR: Record<ValidationStatus, keyof typeof COLORS> = {
  imported: "slate",
  to_verify: "amber",
  validated: "blue",
  published: "emerald",
  archived: "slate",
  rejected: "red",
};

const VALIDATION_ICON: Record<ValidationStatus, LucideIcon> = {
  imported: Upload,
  to_verify: Eye,
  validated: ShieldCheck,
  published: Globe2,
  archived: Archive,
  rejected: XCircle,
};

export function ValidationStatusBadge({ status }: { status: ValidationStatus }) {
  return (
    <Badge color={VALIDATION_COLOR[status]} icon={VALIDATION_ICON[status]}>
      {VALIDATION_STATUS_LABELS[status]}
    </Badge>
  );
}

const SEVERITY_COLOR: Record<AnomalySeverity, keyof typeof COLORS> = {
  info: "blue",
  warning: "amber",
  blocking: "red",
};

const SEVERITY_ICON: Record<AnomalySeverity, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  blocking: AlertOctagon,
};

export function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  return (
    <Badge color={SEVERITY_COLOR[severity]} icon={SEVERITY_ICON[severity]}>
      {ANOMALY_SEVERITY_LABELS[severity]}
    </Badge>
  );
}
