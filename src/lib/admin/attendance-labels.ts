import type { AttendanceStatus } from "@/components/admin/operations-types";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  sick: "Maladie",
  unexcused: "Abs. injust.",
  leave: "Congé",
  mission: "Mission",
  training: "Formation",
};

export const ATTENDANCE_STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: "P",
  sick: "M",
  unexcused: "A",
  leave: "C",
  mission: "Mi",
  training: "F",
};

export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[];

/** Row / badge colors for quick scanning */
export const ATTENDANCE_STATUS_TONE: Record<
  AttendanceStatus,
  { badge: string; row: string }
> = {
  present: {
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
    row: "bg-emerald-50/40",
  },
  sick: {
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    row: "bg-amber-50/40",
  },
  unexcused: {
    badge: "bg-red-100 text-red-900 border-red-200",
    row: "bg-red-50/40",
  },
  leave: {
    badge: "bg-sky-100 text-sky-900 border-sky-200",
    row: "bg-sky-50/40",
  },
  mission: {
    badge: "bg-violet-100 text-violet-900 border-violet-200",
    row: "bg-violet-50/40",
  },
  training: {
    badge: "bg-indigo-100 text-indigo-900 border-indigo-200",
    row: "bg-indigo-50/40",
  },
};

export const DEFAULT_TIME_IN = "07:00";
export const DEFAULT_TIME_OUT = "17:00";
