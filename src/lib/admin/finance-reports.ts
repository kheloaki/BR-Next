import { FINANCE_CASHFLOW_TYPES } from "@/lib/admin/finance-rules";
import { signedMovementAmount } from "@/lib/admin/finance-rules";
import { buildAdminCsv } from "@/lib/admin/admin-csv-export";
import type {
  FinanceAccount,
  FinanceDocument,
  FinanceMovement,
} from "@/lib/admin/finance-types";
import { roundMoney } from "@/lib/admin/price-ht-ttc";

export type FinanceReportKind =
  | "journal_caisse"
  | "journal_banque"
  | "tresorerie"
  | "balance_clients"
  | "balance_fournisseurs"
  | "impayes_clients"
  | "dettes_fournisseurs"
  | "encaissements"
  | "decaissements"
  | "depenses_categorie"
  | "situation_mensuelle"
  | "cheques"
  | "virements";

export function buildJournalReport(
  movements: FinanceMovement[],
  accountName: string,
  from: string,
  to: string,
) {
  return {
    title: `Journal — ${accountName}`,
    period: { from, to },
    rows: movements.map((m) => ({
      date: m.movementDate,
      reference: m.reference,
      type: m.movementType,
      category: m.categoryName ?? "",
      amount: m.amount,
      project: m.projectName ?? "",
      notes: m.notes ?? "",
    })),
    totals: {
      income: roundMoney(
        movements.filter((m) => m.movementType === "income").reduce((s, m) => s + m.amount, 0),
      ),
      expense: roundMoney(
        movements.filter((m) => m.movementType === "expense").reduce((s, m) => s + m.amount, 0),
      ),
    },
  };
}

export function buildTresorerieReport(accounts: FinanceAccount[]) {
  const cash = accounts.filter((a) => a.accountType === "cash");
  const bank = accounts.filter((a) => a.accountType === "bank");
  const totalCash = roundMoney(cash.reduce((s, a) => s + (a.balance ?? 0), 0));
  const totalBank = roundMoney(bank.reduce((s, a) => s + (a.balance ?? 0), 0));
  return {
    title: "Trésorerie générale",
    cash,
    bank,
    totalCash,
    totalBank,
    total: roundMoney(totalCash + totalBank),
  };
}

export function buildBalanceClientsReport(documents: FinanceDocument[]) {
  const byCustomer = new Map<string, { name: string; total: number; paid: number; remaining: number }>();
  for (const d of documents) {
    if (!d.customerId) continue;
    const key = d.customerId;
    const cur = byCustomer.get(key) ?? {
      name: d.customerName ?? key,
      total: 0,
      paid: 0,
      remaining: 0,
    };
    cur.total += d.amountTtc;
    cur.paid += d.paidAmount;
    cur.remaining += d.remainingAmount;
    byCustomer.set(key, cur);
  }
  return {
    title: "Balance clients",
    rows: [...byCustomer.values()].map((r) => ({
      customer: r.name,
      totalTtc: roundMoney(r.total),
      paid: roundMoney(r.paid),
      remaining: roundMoney(r.remaining),
    })),
  };
}

export function buildBalanceSuppliersReport(documents: FinanceDocument[]) {
  const bySupplier = new Map<string, { name: string; total: number; paid: number; remaining: number }>();
  for (const d of documents) {
    if (!d.supplierId) continue;
    const key = d.supplierId;
    const cur = bySupplier.get(key) ?? {
      name: d.supplierName ?? key,
      total: 0,
      paid: 0,
      remaining: 0,
    };
    cur.total += d.amountTtc;
    cur.paid += d.paidAmount;
    cur.remaining += d.remainingAmount;
    bySupplier.set(key, cur);
  }
  return {
    title: "Balance fournisseurs",
    rows: [...bySupplier.values()].map((r) => ({
      supplier: r.name,
      totalTtc: roundMoney(r.total),
      paid: roundMoney(r.paid),
      remaining: roundMoney(r.remaining),
    })),
  };
}

export function buildCashflowPeriodReport(movements: FinanceMovement[], title: string) {
  let encaissements = 0;
  let decaissements = 0;
  for (const m of movements) {
    if (!FINANCE_CASHFLOW_TYPES.includes(m.movementType)) continue;
    if (m.movementType === "income") encaissements += m.amount;
    if (m.movementType === "expense") decaissements += m.amount;
  }
  return {
    title,
    encaissements: roundMoney(encaissements),
    decaissements: roundMoney(decaissements),
    net: roundMoney(encaissements - decaissements),
    count: movements.length,
  };
}

export function buildExpensesByCategory(movements: FinanceMovement[]) {
  const byCat = new Map<string, number>();
  for (const m of movements) {
    if (m.movementType !== "expense") continue;
    const name = m.categoryName ?? "—";
    byCat.set(name, (byCat.get(name) ?? 0) + m.amount);
  }
  return {
    title: "Dépenses par catégorie",
    rows: [...byCat.entries()]
      .map(([category, amount]) => ({ category, amount: roundMoney(amount) }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export function buildMonthlySituation(
  movements: FinanceMovement[],
  month: string,
) {
  const filtered = movements.filter((m) => m.movementDate.startsWith(month));
  let income = 0;
  let expense = 0;
  for (const m of filtered) {
    if (!FINANCE_CASHFLOW_TYPES.includes(m.movementType)) continue;
    income += signedMovementAmount(m.movementType, m.amount) > 0 ? m.amount : 0;
    expense += m.movementType === "expense" ? m.amount : 0;
  }
  return {
    title: `Situation financière — ${month}`,
    income: roundMoney(income),
    expense: roundMoney(expense),
    net: roundMoney(income - expense),
  };
}

export function buildChequesReport(movements: FinanceMovement[]) {
  return {
    title: "État des chèques",
    rows: movements
      .filter((m) => m.paymentMethod === "cheque" && m.chequeNumber)
      .map((m) => ({
        date: m.movementDate,
        chequeNumber: m.chequeNumber,
        amount: m.amount,
        account: m.accountName ?? "",
        reference: m.reference,
      })),
  };
}

export function buildVirementsReport(movements: FinanceMovement[]) {
  return {
    title: "État des virements",
    rows: movements
      .filter((m) => m.paymentMethod === "transfer" || m.virementRef)
      .map((m) => ({
        date: m.movementDate,
        virementRef: m.virementRef ?? m.reference,
        amount: m.amount,
        account: m.accountName ?? "",
        type: m.movementType,
      })),
  };
}

export function reportToCsv(report: { title: string; rows?: Record<string, unknown>[] }) {
  if (!report.rows?.length) {
    return buildAdminCsv(
      { title: `BARANE INVEST — ${report.title}`, organization: "BARANE INVEST" },
      [{ header: "Information", value: () => "Aucune donnée" }],
      [{}],
    );
  }
  const keys = Object.keys(report.rows[0]!);
  const columns = keys.map((key) => ({
    header: key,
    value: (row: Record<string, unknown>) => row[key],
  }));
  return buildAdminCsv(
    { title: `BARANE INVEST — ${report.title}`, organization: "BARANE INVEST" },
    columns,
    report.rows,
  );
}
