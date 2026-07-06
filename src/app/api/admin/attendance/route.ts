import { NextResponse } from "next/server";
import type { AttendanceStatus } from "@/components/admin/operations-types";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { attendanceCsv } from "@/lib/admin/ops-csv-export";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    employeeId: (r.employee_id as string) || "",
    employeeName: r.employee_name as string,
    matricule: r.matricule as string,
    role: r.role as string,
    recordDate: r.record_date as string,
    timeIn: r.time_in as string,
    timeOut: r.time_out as string,
    status: r.status as AttendanceStatus,
    overtimeHours: Number(r.overtime_hours ?? 0),
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    task: r.task as string,
    notes: r.notes as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const date = searchParams.get("date");

  let query = getSupabaseAdminClient()
    .from("admin_attendance")
    .select("*")
    .eq("organization_id", organizationId)
    .order("record_date", { ascending: false });

  if (date) {
    query = query.eq("record_date", date.slice(0, 10));
  } else if (month) {
    query = query.gte("record_date", `${month}-01`).lte("record_date", `${month}-31`);
  } else {
    query = query.limit(200);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map(mapRow);

  const exportFormat = searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return attendanceCsv(rows, {
      month: month ?? undefined,
      date: date ?? undefined,
      format: parseExportFormat(exportFormat),
    });
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as Record<string, unknown>;

  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(supabase, organizationId, body.projectId as string);

  const { data, error } = await supabase.from("admin_attendance").insert({
      id: opsId("att"),
      user_id: userId, organization_id: organizationId,
      employee_id: (body.employeeId as string) || null,
      employee_name: String(body.employeeName || "").trim(),
      matricule: String(body.matricule || "").trim(),
      role: String(body.role || "").trim(),
      record_date: (body.recordDate as string) || new Date().toISOString().slice(0, 10),
      time_in: String(body.timeIn || "").trim(),
      time_out: String(body.timeOut || "").trim(),
      status: (body.status as AttendanceStatus) || "present",
      overtime_hours: Number(body.overtimeHours) || 0,
      project_id: project.project_id,
      site_name: project.site_name,
      task: String(body.task || "").trim(),
      notes: String(body.notes || "").trim(),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapRow(data));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_attendance")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
