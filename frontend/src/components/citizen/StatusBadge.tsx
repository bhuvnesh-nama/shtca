import React from "react";
import { cn } from "@/lib/utils";
import type { IncidentStatus } from "@/types/incident";

interface StatusBadgeProps {
  status: IncidentStatus | string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  reported: {
    label: "Pending Review",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  under_review: {
    label: "Under Review",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-800",
    dot: "bg-blue-600",
  },
  action_pending: {
    label: "Assigned to Officer",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-300 dark:border-indigo-800",
    dot: "bg-indigo-600",
  },
  resolution_submitted: {
    label: "Work in Progress",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-800",
    dot: "bg-purple-600",
  },
  resolved_verified: {
    label: "Resolved",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-600",
  },
  closed_unverified: {
    label: "Closed",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-300 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-300 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  reopened: {
    label: "Re-Opened",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300 font-bold",
    border: "border-rose-300 dark:border-rose-800",
    dot: "bg-rose-600 animate-ping",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig.reported;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
};

