import { NextResponse } from "next/server";
import { assertFinanceAccess } from "@/lib/admin/finance-permissions";
import {
  ensureFinanceCategories,
  loadAccountBalances,
  mapFinanceAccount,
  newFinanceId,
} from "@/lib/admin/finance-server";
import type { FinanceAccountType } from "@/lib/admin/finance-types";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const accountType = searchParams.get("type") as FinanceAccountType | null;

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("admin_finance_accounts")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("name");
  if (accountType === "cash" || accountType === "bank") {
    query = query.eq("account_type", accountType);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const balances = await loadAccountBalances(auth.organizationId);
  return NextResponse.json(
    (data ?? []).map((row) => mapFinanceAccount(row as Record<string, unknown>, balances.get(row.id as string))),
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  await ensureFinanceCategories(auth.organizationId);

  const body = (await request.json()) as {
    name?: string;
    code?: string;
    accountType?: FinanceAccountType;
    openingBalance?: number;
    isDefault?: boolean;
    bankName?: string;
    rib?: string;
    iban?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom du compte requis" }, { status: 400 });
  }
  const accountType = body.accountType === "bank" ? "bank" : "cash";

  const supabase = getSupabaseAdminClient();
  if (body.isDefault) {
    await supabase
      .from("admin_finance_accounts")
      .update({ is_default: false })
      .eq("organization_id", auth.organizationId)
      .eq("account_type", accountType);
  }

  const id = newFinanceId("facc");
  const { data, error } = await supabase
    .from("admin_finance_accounts")
    .insert({
      id,
      organization_id: auth.organizationId,
      user_id: auth.userId,
      name: body.name.trim(),
      code: body.code?.trim() || id.slice(-6).toUpperCase(),
      account_type: accountType,
      opening_balance: body.openingBalance ?? 0,
      is_default: Boolean(body.isDefault),
      bank_name: body.bankName?.trim() || null,
      rib: body.rib?.trim() || null,
      iban: body.iban?.trim() || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const opening = Number(data.opening_balance) || 0;
  return NextResponse.json(mapFinanceAccount(data as Record<string, unknown>, opening));
}

export async function PATCH(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    code?: string;
    openingBalance?: number;
    isActive?: boolean;
    isDefault?: boolean;
    bankName?: string;
    rib?: string;
    iban?: string;
  };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("admin_finance_accounts")
    .select("account_type")
    .eq("id", body.id)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  if (body.isDefault) {
    await supabase
      .from("admin_finance_accounts")
      .update({ is_default: false })
      .eq("organization_id", auth.organizationId)
      .eq("account_type", existing.account_type);
  }

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) payload.name = body.name.trim();
  if (body.code !== undefined) payload.code = body.code.trim();
  if (body.openingBalance !== undefined) payload.opening_balance = body.openingBalance;
  if (body.isActive !== undefined) payload.is_active = body.isActive;
  if (body.isDefault !== undefined) payload.is_default = body.isDefault;
  if (body.bankName !== undefined) payload.bank_name = body.bankName?.trim() || null;
  if (body.rib !== undefined) payload.rib = body.rib?.trim() || null;
  if (body.iban !== undefined) payload.iban = body.iban?.trim() || null;

  const { data, error } = await supabase
    .from("admin_finance_accounts")
    .update(payload)
    .eq("id", body.id)
    .eq("organization_id", auth.organizationId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const balances = await loadAccountBalances(auth.organizationId, [body.id]);
  return NextResponse.json(mapFinanceAccount(data as Record<string, unknown>, balances.get(body.id)));
}
