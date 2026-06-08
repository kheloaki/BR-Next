import { NextResponse } from "next/server";
import { isValidMovementTypeForCategory, validateMovementInput } from "@/lib/admin/finance-rules";
import {
  assertFinanceAccess,
  assertFinanceManage,
  canVoidMovement,
} from "@/lib/admin/finance-permissions";
import {
  MOVEMENT_SELECT,
  mapFinanceMovement,
  newFinanceId,
} from "@/lib/admin/finance-server";
import type { FinanceMovementType, FinancePaymentMethod } from "@/lib/admin/finance-types";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const projectId = searchParams.get("projectId");
  const customerId = searchParams.get("customerId");
  const supplierId = searchParams.get("supplierId");
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const includeVoided = searchParams.get("includeVoided") === "1";
  const format = searchParams.get("format");

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("admin_finance_movements")
    .select(MOVEMENT_SELECT)
    .eq("organization_id", auth.organizationId)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!includeVoided) query = query.is("voided_at", null);
  if (accountId) query = query.eq("account_id", accountId);
  if (projectId) query = query.eq("project_id", projectId);
  if (customerId) query = query.eq("customer_id", customerId);
  if (supplierId) query = query.eq("supplier_id", supplierId);
  if (dateFrom) query = query.gte("movement_date", dateFrom);
  if (dateTo) query = query.lte("movement_date", dateTo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((row) => mapFinanceMovement(row as Record<string, unknown>));

  if (format === "csv") {
    const header = "Date;Référence;Type;Montant;Compte;Catégorie;Chantier;Notes\n";
    const lines = rows
      .map(
        (r) =>
          `${r.movementDate};${r.reference};${r.movementType};${r.amount};${r.accountName ?? ""};${r.categoryName ?? ""};${r.projectName ?? ""};${(r.notes ?? "").replace(/;/g, ",")}`,
      )
      .join("\n");
    return new NextResponse(header + lines, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="journal-finance.csv"',
      },
    });
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceManage(auth.role);
  if (denied) return denied;

  const body = (await request.json()) as {
    accountId?: string;
    categoryId?: string;
    movementType?: FinanceMovementType;
    amount?: number;
    movementDate?: string;
    reference?: string;
    paymentMethod?: FinancePaymentMethod | null;
    projectId?: string | null;
    customerId?: string | null;
    supplierId?: string | null;
    chequeNumber?: string | null;
    virementRef?: string | null;
    effectRef?: string | null;
    notes?: string | null;
    receiptUrl?: string | null;
    amountHt?: number | null;
    vatAmount?: number | null;
  };

  const validationError = validateMovementInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const movementType = body.movementType ?? "expense";
  const supabase = getSupabaseAdminClient();

  const { data: category } = await supabase
    .from("admin_finance_categories")
    .select("direction")
    .eq("id", body.categoryId!)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();
  if (!category) return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  if (!isValidMovementTypeForCategory(movementType, category.direction as "income" | "expense" | "both")) {
    return NextResponse.json({ error: "Type de mouvement incompatible avec la catégorie" }, { status: 400 });
  }

  const id = newFinanceId("fmov");
  const { data, error } = await supabase
    .from("admin_finance_movements")
    .insert({
      id,
      organization_id: auth.organizationId,
      account_id: body.accountId!,
      category_id: body.categoryId!,
      movement_type: movementType,
      amount: body.amount!,
      movement_date: body.movementDate!.slice(0, 10),
      reference: body.reference!.trim(),
      payment_method: body.paymentMethod ?? null,
      project_id: body.projectId?.trim() || null,
      customer_id: body.customerId?.trim() || null,
      supplier_id: body.supplierId?.trim() || null,
      cheque_number: body.chequeNumber?.trim() || null,
      virement_ref: body.virementRef?.trim() || null,
      effect_ref: body.effectRef?.trim() || null,
      created_by: auth.userId,
      notes: body.notes?.trim() || null,
      receipt_url: body.receiptUrl?.trim() || null,
      amount_ht: body.amountHt ?? null,
      vat_amount: body.vatAmount ?? null,
    })
    .select(MOVEMENT_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Référence déjà utilisée" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(mapFinanceMovement(data as Record<string, unknown>));
}

export async function PATCH(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    id?: string;
    action?: "void";
    voidReason?: string;
    notes?: string;
    isReconciled?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();

  if (body.action === "void") {
    if (!canVoidMovement(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const { data, error } = await supabase
      .from("admin_finance_movements")
      .update({
        voided_at: new Date().toISOString(),
        voided_by: auth.userId,
        void_reason: body.voidReason?.trim() || "Annulation",
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("organization_id", auth.organizationId)
      .is("voided_at", null)
      .select(MOVEMENT_SELECT)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapFinanceMovement(data as Record<string, unknown>));
  }

  const denied = assertFinanceManage(auth.role);
  if (denied) return denied;

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;
  if (body.isReconciled !== undefined) {
    payload.is_reconciled = body.isReconciled;
    payload.reconciled_at = body.isReconciled ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("admin_finance_movements")
    .update(payload)
    .eq("id", body.id)
    .eq("organization_id", auth.organizationId)
    .select(MOVEMENT_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapFinanceMovement(data as Record<string, unknown>));
}
