import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import {
  financeBalanceClientsCsv,
  financeBalanceSuppliersCsv,
  financeChequesCsv,
  financeDettesCsv,
  financeExpensesByCategoryCsv,
  financeImpayesCsv,
  financeJournalCsv,
  financeMonthlySituationCsv,
  financeMovementsCsv,
  financeTreasuryCsv,
  financeVirementsCsv,
} from "@/lib/admin/finance-csv-export";
import { assertFinanceAccess, canExportFinance } from "@/lib/admin/finance-permissions";
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
  type FinanceReportKind,
} from "@/lib/admin/finance-reports";
import {
  DOCUMENT_SELECT,
  MOVEMENT_SELECT,
  loadAccountBalances,
  mapFinanceAccount,
  mapFinanceDocument,
  mapFinanceMovement,
} from "@/lib/admin/finance-server";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as FinanceReportKind | null;
  const formatParam = searchParams.get("format");
  const exportFormat = parseExportFormat(formatParam);
  const accountId = searchParams.get("accountId");
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const month = searchParams.get("month") ?? to.slice(0, 7);

  if (!kind) return NextResponse.json({ error: "kind requis" }, { status: 400 });
  if ((formatParam === "csv" || formatParam === "excel") && !canExportFinance(auth.role)) {
    return NextResponse.json({ error: "Export refusé" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  const isExport = formatParam === "csv" || formatParam === "excel";

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
    if (isExport) {
      return financeTreasuryCsv([...report.cash, ...report.bank], report, exportFormat);
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
        ? { title: "État des impayés clients", docs }
        : buildBalanceClientsReport(docs);
    if (isExport) {
      if (kind === "impayes_clients") {
        return financeImpayesCsv(docs, exportFormat);
      }
      return financeBalanceClientsCsv(
        (report as ReturnType<typeof buildBalanceClientsReport>).rows ?? [],
        exportFormat,
      );
    }
    if (kind === "impayes_clients") {
      return NextResponse.json({
        title: report.title,
        rows: docs.map((d) => ({
          client: d.customerName,
          numero: d.documentNumber,
          echeance: d.dueDate,
          montant: d.amountTtc,
          reste: d.remainingAmount,
          statut: d.paymentStatus,
        })),
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
        ? { title: "État des dettes fournisseurs", docs }
        : buildBalanceSuppliersReport(docs);
    if (isExport) {
      if (kind === "dettes_fournisseurs") {
        return financeDettesCsv(docs, exportFormat);
      }
      return financeBalanceSuppliersCsv(
        (report as ReturnType<typeof buildBalanceSuppliersReport>).rows ?? [],
        exportFormat,
      );
    }
    if (kind === "dettes_fournisseurs") {
      return NextResponse.json({
        title: report.title,
        rows: docs.map((d) => ({
          fournisseur: d.supplierName,
          numero: d.documentNumber,
          echeance: d.dueDate,
          montant: d.amountTtc,
          reste: d.remainingAmount,
          statut: d.paymentStatus,
        })),
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
      const { data: acc } = accountId
        ? await supabase.from("admin_finance_accounts").select("name, account_type").eq("id", accountId).maybeSingle()
        : { data: null };
      report = buildJournalReport(
        movements,
        acc?.name ?? (kind === "journal_caisse" ? "Caisse" : "Banque"),
        from,
        to,
      );
      if (isExport) {
        return financeJournalCsv(
          (report.rows ?? []).map((r) => ({
            date: String(r.date ?? ""),
            reference: String(r.reference ?? ""),
            type: String(r.type ?? ""),
            category: String(r.category ?? ""),
            amount: Number(r.amount ?? 0),
            project: String(r.project ?? ""),
            notes: String(r.notes ?? ""),
          })),
          report.title,
          from,
          to,
          exportFormat,
        );
      }
      break;
    }
    case "encaissements": {
      const incomeMovements = movements.filter((m) => m.movementType === "income");
      const cashflow = buildCashflowPeriodReport(incomeMovements, "Encaissements par période");
      report = cashflow;
      if (isExport) {
        return financeMovementsCsv(incomeMovements, {
          from,
          to,
          title: cashflow.title,
          subtitle: `Total encaissé : ${cashflow.encaissements.toLocaleString("fr-FR")} MAD · ${cashflow.count} mouvement(s)`,
          format: exportFormat,
        });
      }
      break;
    }
    case "decaissements": {
      const expenseMovements = movements.filter((m) => m.movementType === "expense");
      const cashflow = buildCashflowPeriodReport(expenseMovements, "Décaissements par période");
      report = cashflow;
      if (isExport) {
        return financeMovementsCsv(expenseMovements, {
          from,
          to,
          title: cashflow.title,
          subtitle: `Total décaissé : ${cashflow.decaissements.toLocaleString("fr-FR")} MAD · ${cashflow.count} mouvement(s)`,
          format: exportFormat,
        });
      }
      break;
    }
    case "depenses_categorie":
      report = buildExpensesByCategory(movements);
      if (isExport) {
        return financeExpensesByCategoryCsv(
          (report.rows ?? []).map((r) => ({
            category: String(r.category ?? ""),
            amount: Number(r.amount ?? 0),
          })),
          exportFormat,
        );
      }
      break;
    case "situation_mensuelle":
      report = buildMonthlySituation(movements, month);
      if (isExport) {
        return financeMonthlySituationCsv(
          report as ReturnType<typeof buildMonthlySituation>,
          month,
          exportFormat,
        );
      }
      break;
    case "cheques":
      report = buildChequesReport(movements);
      if (isExport) {
        return financeChequesCsv(
          (report.rows ?? []).map((r) => ({
            date: String(r.date ?? ""),
            chequeNumber: r.chequeNumber ? String(r.chequeNumber) : null,
            amount: Number(r.amount ?? 0),
            account: String(r.account ?? ""),
            reference: String(r.reference ?? ""),
          })),
          exportFormat,
        );
      }
      break;
    case "virements":
      report = buildVirementsReport(movements);
      if (isExport) {
        return financeVirementsCsv(
          (report.rows ?? []).map((r) => ({
            date: String(r.date ?? ""),
            virementRef: String(r.virementRef ?? ""),
            amount: Number(r.amount ?? 0),
            account: String(r.account ?? ""),
            type: String(r.type ?? ""),
          })),
          exportFormat,
        );
      }
      break;
    default:
      return NextResponse.json({ error: "Rapport inconnu" }, { status: 400 });
  }

  return NextResponse.json(report);
}
