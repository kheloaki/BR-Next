"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmployeeSelectWithAdd } from "@/components/admin/EmployeeSelectWithAdd";
import { FinanceMovementForm } from "@/components/admin/FinanceMovementForm";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { ProjectCostBreakdownCard } from "@/components/admin/ProjectCostBreakdownCard";
import { ProjectCumulativeCostPanel } from "@/components/admin/ProjectCumulativeCostPanel";
import { ProjectFicheActivityOverview } from "@/components/admin/ProjectFicheActivityOverview";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type {
  AdminEmployee,
  AdminProject,
  PersonnelCategory,
  ProjectDashboard,
  ProjectSummary,
  StockItem,
} from "@/components/admin/operations-types";
import type { FinanceAccount, FinanceCategory } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  btnPrimarySm,
  btnSecondary,
  btnSecondarySm,
  ficheAmountClass,
  ficheIncomeFooterRow,
  inputClass,
  inventoryPanelTitle,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { ProjectFicheDashboardSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { formatMoney } from "@/lib/admin/price-ht-ttc";
import { FINANCE_PAYMENT_STATUS_LABELS } from "@/lib/admin/finance-types";
import { isProjectFicheSectionVisible } from "@/lib/admin/project-fiche-sections";

type SheetKind = "material" | "labor" | "payment" | "expense" | null;

function fmtDate(d: string) {
  const x = d.slice(0, 10);
  if (!x) return "—";
  const [y, m, day] = x.split("-");
  return `${day}/${m}/${y}`;
}

export function ProjectFicheDashboard({
  projectId,
  projectName,
  project,
  summary,
  canManageFinance,
  canSeeFinancials,
}: {
  projectId: string;
  projectName: string;
  project: AdminProject;
  summary: ProjectSummary;
  canManageFinance: boolean;
  canSeeFinancials: boolean;
}) {
  const toast = useAdminToast();
  const { equipment, employees, projects, refresh: refreshRef } = useOpsReferential();
  const [personnelCategories, setPersonnelCategories] = useState<PersonnelCategory[]>([]);
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [financeAccounts, setFinanceAccounts] = useState<FinanceAccount[]>([]);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [savingLabor, setSavingLabor] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<"acompte" | string>("acompte");

  const [materialForm, setMaterialForm] = useState({
    stockItemId: "",
    equipmentId: "",
    qty: 1,
    usageDate: new Date().toISOString().slice(0, 10),
    usageType: "part" as "part" | "lubricant",
  });

  const [laborForm, setLaborForm] = useState({
    employeeId: "",
    employeeName: "",
    workDate: new Date().toISOString().slice(0, 10),
    daysWorked: 1,
    dailyRate: 0,
    notes: "",
  });

  const showError = toast.error;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}/dashboard`, {
      cache: "no-store",
    });
    if (res.ok) {
      setDashboard((await res.json()) as ProjectDashboard);
    } else {
      showError(await readApiError(res));
      setDashboard(null);
    }
    setLoading(false);
  }, [projectId, showError]);

  const loadFinanceReferential = useCallback(async () => {
    const [accRes, catRes, custRes, supRes, stockRes] = await Promise.all([
      fetch("/api/admin/finance/accounts", { cache: "no-store" }),
      fetch("/api/admin/finance/categories", { cache: "no-store" }),
      fetch("/api/admin/customers", { cache: "no-store" }),
      fetch("/api/admin/suppliers", { cache: "no-store" }),
      fetch("/api/admin/stock/items", { cache: "no-store" }),
    ]);
    if (accRes.ok) setFinanceAccounts((await accRes.json()) as FinanceAccount[]);
    if (catRes.ok) setFinanceCategories((await catRes.json()) as FinanceCategory[]);
    if (custRes.ok) {
      const rows = (await custRes.json()) as { id: string; name: string }[];
      setCustomers(rows.map((c) => ({ id: c.id, name: c.name })));
    }
    if (supRes.ok) {
      const rows = (await supRes.json()) as { id: string; name: string }[];
      setSuppliers(rows.map((s) => ({ id: s.id, name: s.name })));
    }
    if (stockRes.ok) setStock((await stockRes.json()) as StockItem[]);
    await refreshRef();
  }, [refreshRef]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (sheet === "payment" || sheet === "expense") {
      void loadFinanceReferential();
    }
    if (sheet === "payment") {
      const open = (dashboard?.clientInvoices ?? []).filter((d) => d.remainingAmount > 0);
      setPaymentTarget(open[0]?.id ?? "acompte");
    }
    if (sheet === "material" || sheet === "labor") {
      void loadFinanceReferential();
    }
    if (sheet === "labor" && personnelCategories.length === 0) {
      void fetch("/api/admin/personnel-categories", { cache: "no-store" }).then(async (res) => {
        if (res.ok) setPersonnelCategories((await res.json()) as PersonnelCategory[]);
      });
    }
  }, [sheet, loadFinanceReferential, personnelCategories.length, dashboard?.clientInvoices]);

  const stockItemOptions = useMemo(
    () => [
      { value: "", label: "Saisie libre" },
      ...stock.map((s) => ({
        value: s.id,
        label: `${s.reference} — ${s.designation}`,
        keywords: `${s.reference} ${s.designation}`,
      })),
    ],
    [stock],
  );

  const equipmentOptions = useMemo(
    () => [
      { value: "", label: "—" },
      ...equipment.map((e) => ({ value: e.id, label: e.name, keywords: e.name })),
    ],
    [equipment],
  );

  const usageTypeOptions = useMemo(
    () => [
      { value: "part", label: "Pièce / matériau" },
      { value: "lubricant", label: "Lubrifiant" },
    ],
    [],
  );

  const paymentTargetOptions = useMemo(() => {
    const invoiceOptions = (dashboard?.clientInvoices ?? [])
      .filter((d) => d.remainingAmount > 0)
      .map((d) => ({
        value: d.id,
        label: `Facture ${d.documentNumber || "—"} · reste ${formatMoney(d.remainingAmount)} MAD (${FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus as keyof typeof FINANCE_PAYMENT_STATUS_LABELS] ?? d.paymentStatus})`,
        keywords: d.documentNumber ?? "",
      }));
    return [...invoiceOptions, { value: "acompte", label: "Acompte chantier (sans facture)" }];
  }, [dashboard?.clientInvoices]);

  async function submitMaterial() {
    if (materialForm.qty <= 0) {
      toast.error("Quantité requise.");
      return;
    }
    setSavingMaterial(true);
    const eq = equipment.find((e) => e.id === materialForm.equipmentId);
    const item = stock.find((s) => s.id === materialForm.stockItemId);
    const res = await fetch("/api/admin/parts-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        equipmentId: materialForm.equipmentId || undefined,
        equipmentName: eq?.name || "—",
        stockItemId: item?.id || null,
        reference: item?.reference || "",
        designation: item?.designation || "Consommation chantier",
        usageType: materialForm.usageType,
        qty: materialForm.qty,
        unitPrice: item?.unitPrice ?? 0,
        usageDate: materialForm.usageDate,
      }),
    });
    setSavingMaterial(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Matériau enregistré.");
    setSheet(null);
    await loadDashboard();
  }

  async function submitLabor() {
    if (!laborForm.employeeName.trim()) {
      toast.error("Sélectionnez un ouvrier.");
      return;
    }
    setSavingLabor(true);
    const res = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}/labor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: laborForm.employeeId || null,
        employeeName: laborForm.employeeName,
        workDate: laborForm.workDate,
        daysWorked: laborForm.daysWorked,
        dailyRate: laborForm.dailyRate,
        notes: laborForm.notes,
      }),
    });
    setSavingLabor(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Main d'œuvre enregistrée.");
    setSheet(null);
    await loadDashboard();
  }

  if (loading) return <ProjectFicheDashboardSkeleton />;

  if (!dashboard) {
    return <p className="text-sm text-red-700">Impossible de charger la fiche projet.</p>;
  }

  const materialsTotal = dashboard.costBreakdown.materials;
  const laborTotal = dashboard.costBreakdown.labor;
  const paymentsTotal = dashboard.montantPaye;
  const vis = (id: Parameters<typeof isProjectFicheSectionVisible>[1]) =>
    isProjectFicheSectionVisible(project, id);

  return (
    <div className="space-y-4">
      <ProjectFicheActivityOverview
        summary={summary}
        project={project}
        canSeeFinancials={canSeeFinancials}
      />

      <AdminMiniStats
        items={[
          { label: "Budget projet", value: formatMoney(dashboard.budgetMad) },
          { label: "Montant payé", value: formatMoney(dashboard.montantPaye) },
          { label: "Reste à recevoir", value: formatMoney(dashboard.resteARecevoir) },
          { label: "Coût total", value: formatMoney(dashboard.totalCostMad) },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]">
        <div className="space-y-4">
          {vis("materials") ? (
          <AdminInventoryCard
            title={`Matériaux consommés (${dashboard.materials.length})`}
            titleClassName={inventoryPanelTitle}
            actions={
              <button type="button" className={btnSecondarySm} onClick={() => setSheet("material")}>
                + Consommer matériau
              </button>
            }
          >
            {dashboard.materials.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--graphite)]/70">
                Aucun matériau enregistré pour ce chantier.
              </p>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Matériau</th>
                    <th className={thClass}>Emplacement</th>
                    <th className={thClass}>Quantité</th>
                    <th className={thClass}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.materials.map((m) => (
                    <tr key={`${m.source}-${m.id}`} className={rowHover}>
                      <td className={tdClass}>{fmtDate(m.date)}</td>
                      <td className={tdTextClass}>
                        <AdminTruncatedText
                          text={`${m.designation}${m.reference ? ` (${m.reference})` : ""}`}
                        />
                      </td>
                      <td className={tdClass}>
                        <AdminTruncatedText text={m.location || projectName} lines={1} />
                      </td>
                      <td className={tdClass}>
                        {m.qty.toLocaleString("fr-MA")} {m.unit}
                      </td>
                      <td className={`${tdClass} font-medium text-[var(--navy)]`}>
                        {formatMoney(m.totalMad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-[var(--background)]/60">
                    <td colSpan={4} className={`${tdClass} text-right text-xs font-semibold uppercase`}>
                      Coût total des matériaux
                    </td>
                    <td className={`${tdClass} font-semibold text-[var(--navy)]`}>
                      {formatMoney(materialsTotal)}
                    </td>
                  </tr>
                </tfoot>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
          ) : null}

          {vis("labor") ? (
          <AdminInventoryCard
            title={`Main d'œuvre (${dashboard.labor.length})`}
            titleClassName={inventoryPanelTitle}
            actions={
              <button type="button" className={btnSecondarySm} onClick={() => setSheet("labor")}>
                + Ajouter main d&apos;œuvre
              </button>
            }
          >
            {dashboard.labor.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--graphite)]/70">
                Aucune saisie main d&apos;œuvre.
              </p>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Ouvriers</th>
                    <th className={thClass}>Jours</th>
                    <th className={thClass}>Tarif/j</th>
                    <th className={thClass}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.labor.map((l) => (
                    <tr key={l.id} className={rowHover}>
                      <td className={tdClass}>{fmtDate(l.workDate)}</td>
                      <td className={tdClass}>
                        <AdminTruncatedText text={l.employeeName} lines={1} />
                      </td>
                      <td className={tdClass}>{l.daysWorked}</td>
                      <td className={tdClass}>{formatMoney(l.dailyRate)}</td>
                      <td className={`${tdClass} ${ficheAmountClass}`}>
                        {formatMoney(l.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-[var(--background)]/60">
                    <td colSpan={4} className={`${tdClass} text-right text-xs font-semibold uppercase`}>
                      Coût main d&apos;œuvre total
                    </td>
                    <td className={`${tdClass} ${ficheAmountClass}`}>{formatMoney(laborTotal)}</td>
                  </tr>
                </tfoot>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
          ) : null}
        </div>

        {vis("costs") ? (
        <div className="space-y-4">
          <ProjectCostBreakdownCard
            breakdown={dashboard.costBreakdown}
            totalCostMad={dashboard.totalCostMad}
          />
          <ProjectCumulativeCostPanel series={dashboard.cumulativeCost} />
        </div>
        ) : null}
      </div>

      {(vis("payments") || vis("expenses")) ? (
      <div className={`grid gap-4 ${vis("payments") && vis("expenses") ? "lg:grid-cols-2" : ""}`}>
        {vis("payments") ? (
        <AdminInventoryCard
          title={`Paiements clients (${dashboard.payments.length})`}
          titleClassName={inventoryPanelTitle}
          actions={
            canManageFinance ? (
              <button type="button" className={btnPrimarySm} onClick={() => setSheet("payment")}>
                + Ajouter un paiement
              </button>
            ) : null
          }
        >
          {dashboard.payments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[var(--graphite)]/70">Aucun paiement enregistré.</p>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Mode de paiement</th>
                  <th className={thClass}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.payments.map((p) => (
                  <tr key={p.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(p.date)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={p.paymentMethod} lines={1} />
                    </td>
                    <td className={`${tdClass} ${ficheAmountClass}`}>{formatMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={ficheIncomeFooterRow}>
                  <td colSpan={2} className={`${tdClass} text-right text-xs font-semibold uppercase text-[var(--navy)]`}>
                    Paiements reçus
                  </td>
                  <td className={`${tdClass} ${ficheAmountClass}`}>{formatMoney(paymentsTotal)}</td>
                </tr>
              </tfoot>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
        ) : null}

        {vis("expenses") ? (
        <AdminInventoryCard
          title={`Dépenses (${dashboard.expenses.length})`}
          titleClassName={inventoryPanelTitle}
          actions={
            canManageFinance ? (
              <button type="button" className={btnSecondarySm} onClick={() => setSheet("expense")}>
                + Ajouter une dépense
              </button>
            ) : null
          }
        >
          {dashboard.expenses.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[var(--graphite)]/70">Aucune dépense enregistrée.</p>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Catégorie</th>
                  <th className={thClass}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.expenses.map((e) => (
                  <tr key={e.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(e.date)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={e.category} lines={1} />
                    </td>
                    <td className={`${tdClass} ${ficheAmountClass}`}>{formatMoney(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-[var(--background)]/60">
                  <td colSpan={2} className={`${tdClass} text-right text-xs font-semibold uppercase`}>
                    Total dépenses
                  </td>
                  <td className={`${tdClass} ${ficheAmountClass}`}>
                    {formatMoney(dashboard.costBreakdown.other)}
                  </td>
                </tr>
              </tfoot>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
        ) : null}
      </div>
      ) : null}

      <AdminDataSheet
        open={sheet === "material"}
        onClose={() => setSheet(null)}
        title="Consommer un matériau"
        description={`Chantier : ${projectName}`}
        footer={
          <button type="button" className={btnPrimary} disabled={savingMaterial} onClick={() => void submitMaterial()}>
            {savingMaterial ? "Enregistrement…" : "Enregistrer"}
          </button>
        }
      >
        <div className="space-y-3">
          <AdminSheetField label="Date">
            <input
              type="date"
              className={inputClass}
              value={materialForm.usageDate}
              onChange={(e) => setMaterialForm((f) => ({ ...f, usageDate: e.target.value }))}
            />
          </AdminSheetField>
          <AdminSheetField label="Article stock">
            <SearchableSelect
              options={stockItemOptions}
              value={materialForm.stockItemId}
              onChange={(v) => setMaterialForm((f) => ({ ...f, stockItemId: v }))}
              placeholder="Saisie libre"
              inputClassName={inputClass}
            />
          </AdminSheetField>
          <AdminSheetField label="Engin">
            <SearchableSelect
              options={equipmentOptions}
              value={materialForm.equipmentId}
              onChange={(v) => setMaterialForm((f) => ({ ...f, equipmentId: v }))}
              placeholder="—"
              inputClassName={inputClass}
            />
          </AdminSheetField>
          <AdminSheetField label="Type">
            <SearchableEnumSelect
              options={usageTypeOptions}
              value={materialForm.usageType}
              onChange={(v) => setMaterialForm((f) => ({ ...f, usageType: v as "part" | "lubricant" }))}
              inputClassName={inputClass}
              allowEmpty={false}
            />
          </AdminSheetField>
          <AdminSheetField label="Quantité" required>
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={materialForm.qty}
              onChange={(e) => setMaterialForm((f) => ({ ...f, qty: Number(e.target.value) || 0 }))}
            />
          </AdminSheetField>
        </div>
      </AdminDataSheet>

      <AdminDataSheet
        open={sheet === "labor"}
        onClose={() => setSheet(null)}
        title="Ajouter main d'œuvre"
        description={`Chantier : ${projectName}`}
        footer={
          <button type="button" className={btnPrimary} disabled={savingLabor} onClick={() => void submitLabor()}>
            {savingLabor ? "Enregistrement…" : "Enregistrer"}
          </button>
        }
      >
        <div className="space-y-3">
          <AdminSheetField label="Ouvrier" required>
            <EmployeeSelectWithAdd
              employees={employees}
              categories={personnelCategories}
              projects={projects}
              value={laborForm.employeeId}
              onChange={(id) => {
                const emp = employees.find((e) => e.id === id);
                setLaborForm((f) => ({
                  ...f,
                  employeeId: id,
                  employeeName: emp?.name ?? "",
                }));
              }}
              label=""
            />
          </AdminSheetField>
          <AdminSheetField label="Date">
            <input
              type="date"
              className={inputClass}
              value={laborForm.workDate}
              onChange={(e) => setLaborForm((f) => ({ ...f, workDate: e.target.value }))}
            />
          </AdminSheetField>
          <AdminSheetField label="Jours travaillés" required>
            <input
              type="number"
              min={0}
              step={0.5}
              className={inputClass}
              value={laborForm.daysWorked}
              onChange={(e) => setLaborForm((f) => ({ ...f, daysWorked: Number(e.target.value) || 0 }))}
            />
          </AdminSheetField>
          <AdminSheetField label="Tarif journalier (MAD)" required>
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={laborForm.dailyRate || ""}
              onChange={(e) => setLaborForm((f) => ({ ...f, dailyRate: Number(e.target.value) || 0 }))}
            />
          </AdminSheetField>
        </div>
      </AdminDataSheet>

      <AdminDataSheet
        open={sheet === "payment"}
        onClose={() => setSheet(null)}
        title="Enregistrer un paiement client"
        description={`Chantier : ${projectName}`}
      >
        {(dashboard?.clientInvoices ?? []).some((d) => d.remainingAmount > 0) ? (
          <div className="mb-4 space-y-3">
            <AdminSheetField label="Affectation">
              <SearchableSelect
                options={paymentTargetOptions}
                value={paymentTarget}
                onChange={setPaymentTarget}
                inputClassName={inputClass}
                allowEmpty={false}
              />
            </AdminSheetField>
          </div>
        ) : null}
        <FinanceMovementForm
          accounts={financeAccounts}
          categories={financeCategories}
          defaultType="income"
          fixedMovementType="income"
          defaultCategorySlug="client_payment"
          hideTypeSelect
          lockProjectId={projectId}
          lockFinanceDocumentId={paymentTarget !== "acompte" ? paymentTarget : undefined}
          defaultAmount={
            paymentTarget !== "acompte"
              ? (dashboard?.clientInvoices ?? []).find((d) => d.id === paymentTarget)?.remainingAmount
              : undefined
          }
          documentAmountHt={
            paymentTarget !== "acompte"
              ? (dashboard?.clientInvoices ?? []).find((d) => d.id === paymentTarget)?.amountHt
              : undefined
          }
          documentAmountTtc={
            paymentTarget !== "acompte"
              ? (dashboard?.clientInvoices ?? []).find((d) => d.id === paymentTarget)?.amountTtc
              : undefined
          }
          referential={{ projects, customers, suppliers }}
          title=""
          onSaved={() => {
            setSheet(null);
            void loadDashboard();
          }}
        />
      </AdminDataSheet>

      <AdminDataSheet
        open={sheet === "expense"}
        onClose={() => setSheet(null)}
        title="Enregistrer une dépense"
        description={`Chantier : ${projectName}`}
      >
        <FinanceMovementForm
          accounts={financeAccounts}
          categories={financeCategories}
          defaultType="expense"
          fixedMovementType="expense"
          hideTypeSelect
          lockProjectId={projectId}
          referential={{ projects, customers, suppliers }}
          title=""
          onSaved={() => {
            setSheet(null);
            void loadDashboard();
          }}
        />
      </AdminDataSheet>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
