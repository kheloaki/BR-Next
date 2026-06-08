import { NextResponse } from "next/server";
import { assertFinanceAccess, canExportFinance } from "@/lib/admin/finance-permissions";
import {
  DOCUMENT_SELECT,
  MOVEMENT_SELECT,
  loadAccountBalances,
  mapFinanceAccount,
  mapFinanceDocument,
  mapFinanceMovement,
} from "@/lib/admin/finance-server";
import {
  buildBalanceClientsReport,
  buildBalanceSuppliersReport,
  buildCashflowPeriodReport,
  buildChequesReport,
  buildExpensesByCategory,
  buildJournalReport,
  buildMonthlySituation,
  buildTresorerieReport,
  buildVirementsReport,
  reportToCsv,
  type FinanceReportKind,
} from "@/lib/admin/finance-reports";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as FinanceReportKind | null;
  const format = searchParams.get("format");
  const accountId = searchParams.get("accountId");
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const month = searchParams.get("month") ?? to.slice(0, 7);

  if (!kind) return NextResponse.json({ error: "kind requis" }, { status: 400 });
  if (format === "csv" && !canExportFinance(auth.role)) {
    return NextResponse.json({ error: "Export refusé" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();

  if (kind === "tresorerie") {
    const { data: accounts } = await supabase
      .from("admin_finance_accounts")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .eq("is_active", true);
    const balances = await loadAccountBalances(auth.organizationId);
    const mapped = (accounts ?? []).map((a) =>
      mapFinanceAccount(a as Record<string, unknown>, balances.get(a.id as string)),
    );
    const report = buildTresorerieReport(mapped);
    if (format === "csv") {
      const rows = [...report.cash, ...report.bank].map((a) => ({
        compte: a.name,
        type: a.accountType,
        solde: a.balance ?? 0,
      }));
      return new NextResponse(reportToCsv({ title: report.title, rows }), {
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    return NextResponse.json(report);
  }

  if (kind === "balance_clients" || kind === "impayes_clients") {
    let query = supabase
      .from("admin_finance_documents")
      .select(DOCUMENT_SELECT)
      .eq("organization_id", auth.organizationId)
      .in("document_type", ["client_invoice", "client_credit"]);
    if (kind === "impayes_clients") {
      query = query.in("payment_status", ["unpaid", "partial", "overdue"]);
    }
    const { data } = await query;
    const docs = (data ?? []).map((r) => mapFinanceDocument(r as Record<string, unknown>));
    const report =
      kind === "impayes_clients"
        ? { title: "État des impayés clients", rows: docs.map((d) => ({
            client: d.customerName,
            numero: d.documentNumber,
            echeance: d.dueDate,
            montant: d.amountTtc,
            reste: d.remainingAmount,
            statut: d.paymentStatus,
          })) }
        : buildBalanceClientsReport(docs);
    if (format === "csv") {
      return new NextResponse(reportToCsv(report as { title: string; rows?: Record<string, unknown>[] }), {
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    return NextResponse.json(report);
  }

  if (kind === "balance_fournisseurs" || kind === "dettes_fournisseurs") {
    let query = supabase
      .from("admin_finance_documents")
      .select(DOCUMENT_SELECT)
      .eq("organization_id", auth.organizationId)
      .in("document_type", ["supplier_invoice", "supplier_credit"]);
    if (kind === "dettes_fournisseurs") {
      query = query.in("payment_status", ["unpaid", "partial", "overdue"]);
    }
    const { data } = await query;
    const docs = (data ?? []).map((r) => mapFinanceDocument(r as Record<string, unknown>));
    const report =
      kind === "dettes_fournisseurs"
        ? {
            title: "État des dettes fournisseurs",
            rows: docs.map((d) => ({
              fournisseur: d.supplierName,
              numero: d.documentNumber,
              echeance: d.dueDate,
              montant: d.amountTtc,
              reste: d.remainingAmount,
              statut: d.paymentStatus,
            })),
          }
        : buildBalanceSuppliersReport(docs);
    if (format === "csv") {
      return new NextResponse(reportToCsv(report as { title: string; rows?: Record<string, unknown>[] }), {
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    return NextResponse.json(report);
  }

  let movQuery = supabase
    .from("admin_finance_movements")
    .select(MOVEMENT_SELECT)
    .eq("organization_id", auth.organizationId)
    .is("voided_at", null)
    .order("movement_date", { ascending: true });
  if (accountId) movQuery = movQuery.eq("account_id", accountId);
  if (from) movQuery = movQuery.gte("movement_date", from);
  if (to) movQuery = movQuery.lte("movement_date", to);

  const { data: movData, error } = await movQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const movements = (movData ?? []).map((r) => mapFinanceMovement(r as Record<string, unknown>));

  let report: { title: string; rows?: Record<string, unknown>[]; [key: string]: unknown };

  switch (kind) {
    case "journal_caisse":
    case "journal_banque": {
      const accountType = kind === "journal_caisse" ? "cash" : "bank";
      const filtered = accountId
        ? movements
        : movements.filter((m) => {
            /* account type filter applied via accountId param ideally */
            return true;
          });
      const { data: acc } = accountId
        ? await supabase.from("admin_finance_accounts").select("name, account_type").eq("id", accountId).maybeSingle()
        : { data: null };
      if (acc && acc.account_type !== accountType && !accountId) {
        /* noop */
      }
      report = buildJournalReport(
        filtered,
        acc?.name ?? (kind === "journal_caisse" ? "Caisse" : "Banque"),
        from,
        to,
      );
      break;
    }
    case "encaissements":
      report = buildCashflowPeriodReport(
        movements.filter((m) => m.movementType === "income"),
        "Encaissements par période",
      );
      break;
    case "decaissements":
      report = buildCashflowPeriodReport(
        movements.filter((m) => m.movementType === "expense"),
        "Décaissements par période",
      );
      break;
    case "depenses_categorie":
      report = buildExpensesByCategory(movements);
      break;
    case "situation_mensuelle":
      report = buildMonthlySituation(movements, month);
      break;
    case "cheques":
      report = buildChequesReport(movements);
      break;
    case "virements":
      report = buildVirementsReport(movements);
      break;
    default:
      return NextResponse.json({ error: "Rapport inconnu" }, { status: 400 });
  }

  if (format === "csv") {
    return new NextResponse(reportToCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${kind}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
