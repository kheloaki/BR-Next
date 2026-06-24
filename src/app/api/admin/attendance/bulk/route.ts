import { NextResponse } from "next/server";
import type { AttendanceStatus } from "@/components/admin/operations-types";
import { ATTENDANCE_STATUSES } from "@/lib/admin/attendance-labels";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type BulkEntry = {
  id?: string;
  employeeId: string;
  employeeName?: string;
  matricule?: string;
  role?: string;
  timeIn?: string;
  timeOut?: string;
  status?: AttendanceStatus;
  notes?: string;
};

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    employeeId: (r.employee_id as string) || "",
    employeeName: r.employee_name as string,
    matricule: r.matricule as string,
    role: r.role as string,
    recordDate: String(r.record_date ?? "").slice(0, 10),
    timeIn: r.time_in as string,
    timeOut: r.time_out as string,
    status: r.status as AttendanceStatus,
    projectId: (r.project_id as string) || null,
    siteName: r.site_name as string,
  };
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const body = (await request.json()) as {
    recordDate?: string;
    projectId?: string;
    entries?: BulkEntry[];
  };

  const recordDate = (body.recordDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (entries.length === 0) {
    return NextResponse.json({ error: "Aucune ligne de pointage." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(supabase, organizationId, body.projectId || "");

  const employeeIds = [...new Set(entries.map((e) => e.employeeId).filter(Boolean))];
  const { data: existingRows, error: loadErr } = await supabase
    .from("admin_attendance")
    .select("id, employee_id")
    .eq("organization_id", organizationId)
    .eq("record_date", recordDate)
    .in("employee_id", employeeIds);

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });

  const existingByEmployee = new Map(
    (existingRows ?? []).map((r) => [r.employee_id as string, r.id as string]),
  );

  let saved = 0;
  const results: ReturnType<typeof mapRow>[] = [];

  for (const entry of entries) {
    if (!entry.employeeId) continue;
    const status = ATTENDANCE_STATUSES.includes(entry.status as AttendanceStatus)
      ? (entry.status as AttendanceStatus)
      : "present";

    const payload = {
      employee_id: entry.employeeId,
      employee_name: String(entry.employeeName || "").trim(),
      matricule: String(entry.matricule || "").trim(),
      role: String(entry.role || "").trim(),
      record_date: recordDate,
      time_in: String(entry.timeIn || "").trim(),
      time_out: String(entry.timeOut || "").trim(),
      status,
      project_id: project.project_id,
      site_name: project.site_name,
      notes: String(entry.notes || "").trim(),
      user_id: userId,
      organization_id: organizationId,
    };

    const existingId = entry.id || existingByEmployee.get(entry.employeeId);
    const result = existingId
      ? await supabase
          .from("admin_attendance")
          .update(payload)
          .eq("id", existingId)
          .eq("organization_id", organizationId)
          .select("*")
          .single()
      : await supabase
          .from("admin_attendance")
          .insert({ id: opsId("att"), ...payload })
          .select("*")
          .single();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    saved += 1;
    results.push(mapRow(result.data as Record<string, unknown>));
    existingByEmployee.set(entry.employeeId, result.data.id as string);
  }

  return NextResponse.json({ saved, rows: results });
}
