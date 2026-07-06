import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { financeClosingsCsv } from "@/lib/admin/referential-csv-export";
import { FINANCE_CASHFLOW_TYPES } from "@/lib/admin/finance-rules";
import { assertFinanceManage, canCloseCaisse } from "@/lib/admin/finance-permissions";
import {
  mapFinanceClosing,
  newFinanceId,
} from "@/lib/admin/finance-server";
import type { FinanceMovementType } from "@/lib/admin/finance-types";
import { signedMovementAmount } from "@/lib/admin/finance-rules";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { roundMoney } from "@/lib/admin/price-ht-ttc";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  const accountId = new URL(request.url).searchParams.get("accountId");
  const format = new URL(request.url).searchParams.get("format");
  let query = getSupabaseAdminClient()
    .from("admin_finance_caisse_closings")
    .select("*, admin_finance_accounts(name)")
    .eq("organization_id", auth.organizationId)
    .order("closing_date", { ascending: false });
  if (accountId) query = query.eq("account_id", accountId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((row) => mapFinanceClosing(row as Record<string, unknown>));
  if (format === "csv" || format === "excel" || format === "xls") {
    return financeClosingsCsv(rows, {
      accountId: accountId ?? undefined,
      format: parseExportFormat(format),
    });
  }
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  if (!canCloseCaisse(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await request.json()) as {
    accountId?: string;
    closingDate?: string;
    countedBalance?: number;
    notes?: string | null;
  };

  if (!body.accountId || !body.closingDate || body.countedBalance == null) {
    return NextResponse.json({ error: "Compte, date et solde compté requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const closingDate = body.closingDate.slice(0, 10);

  const { data: account } = await supabase
    .from("admin_finance_accounts")
    .select("*")
    .eq("id", body.accountId)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const { data: priorClosing } = await supabase
    .from("admin_finance_caisse_closings")
    .select("theoretical_balance, closing_date")
    .eq("account_id", body.accountId)
    .lt("closing_date", closingDate)
    .order("closing_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const openingBalance = priorClosing
    ? Number(priorClosing.theoretical_balance)
    : Number(account.opening_balance) || 0;

  const periodStart = priorClosing
    ? new Date(priorClosing.closing_date as string)
    : new Date("1970-01-01");
  periodStart.setDate(periodStart.getDate() + 1);
  const fromDate = priorClosing ? (priorClosing.closing_date as string) : "1970-01-01";

  const { data: movements } = await supabase
    .from("admin_finance_movements")
    .select("movement_type, amount")
    .eq("account_id", body.accountId)
    .eq("organization_id", auth.organizationId)
    .is("voided_at", null)
    .gt("movement_date", fromDate)
    .lte("movement_date", closingDate);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const m of movements ?? []) {
    const type = m.movement_type as FinanceMovementType;
    if (!FINANCE_CASHFLOW_TYPES.includes(type)) continue;
    if (type === "income") totalIncome += Number(m.amount);
    if (type === "expense") totalExpense += Number(m.amount);
  }

  const theoreticalBalance = roundMoney(
    openingBalance +
      (movements ?? []).reduce(
        (s, m) => s + signedMovementAmount(m.movement_type as FinanceMovementType, Number(m.amount)),
        0,
      ),
  );
  const countedBalance = roundMoney(body.countedBalance);
  const difference = roundMoney(countedBalance - theoreticalBalance);

  const id = newFinanceId("fclose");
  const { data, error } = await supabase
    .from("admin_finance_caisse_closings")
    .insert({
      id,
      organization_id: auth.organizationId,
      account_id: body.accountId,
      closing_date: closingDate,
      opening_balance: openingBalance,
      total_income: roundMoney(totalIncome),
      total_expense: roundMoney(totalExpense),
      theoretical_balance: theoreticalBalance,
      counted_balance: countedBalance,
      difference,
      closed_by: auth.userId,
      signed_at: new Date().toISOString(),
      notes: body.notes?.trim() || null,
    })
    .select("*, admin_finance_accounts(name)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Clôture déjà enregistrée pour cette date" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapFinanceClosing(data as Record<string, unknown>));
}
