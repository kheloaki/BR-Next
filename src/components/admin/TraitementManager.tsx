"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { CustomerSelect } from "@/components/admin/CustomerSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { withEmptyOption } from "@/components/admin/searchable-options";
import { DepotSelect } from "@/components/admin/DepotSelect";
import { SupplierSelectWithAdd } from "@/components/admin/SupplierSelectWithAdd";
import { ProductSelectWithAdd } from "@/components/admin/ProductSelectWithAdd";
import type { StockItem } from "@/components/admin/operations-types";
import type { Customer } from "@/components/admin/devis-types";
import type { Product, Supplier } from "@/components/admin/devis-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  filterBarClass,
  filterInputClass,
  inputClass,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { TraitementsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { VatRateSelect } from "@/components/admin/VatRateSelect";
import { DEFAULT_VAT_RATE, formatMoney, lineTotalTtc, linesTotalTtc } from "@/lib/admin/price-ht-ttc";
import { TraitementAchatToVenteSheet, canConvertAchatToVente } from "@/components/admin/TraitementAchatToVenteSheet";
import { TraitementDocumentQuickSheet } from "@/components/admin/TraitementDocumentQuickSheet";
import { TraitementFinancePanel } from "@/components/admin/TraitementFinancePanel";
import { TraitementFinanceTableCell } from "@/components/admin/TraitementFinanceTableCell";
import { TraitementImmediatePaymentPrompt } from "@/components/admin/TraitementImmediatePaymentPrompt";
import { TraitementGasoilCommandeSheet } from "@/components/admin/TraitementGasoilCommandeSheet";
import { TraitementGasoilReceptionSheet } from "@/components/admin/TraitementGasoilReceptionSheet";
import { traitementStepToDocumentType } from "@/lib/admin/traitement-document";
import { traitementsHref } from "@/lib/admin/traitement-nav";
import { inferDraftTraitementSupplyKind } from "@/lib/admin/traitement-supply-kind";
import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";
import {
  TRAITEMENT_STATUS_LABELS,
  TRAITEMENT_STEP_LABELS,
  TRAITEMENT_STEP_STATUS_LABELS,
  TRAITEMENT_STEPS_BY_TYPE,
  traitementLineTotal,
  type Traitement,
  type TraitementLineInput,
  type TraitementStatus,
  type TraitementStep,
  type TraitementStepKey,
  type TraitementStepStatus,
  type TraitementType,
} from "@/lib/admin/traitement-types";

type DraftLine = TraitementLineInput & { key: string };

function stepButtonClass(status: TraitementStepStatus, active?: boolean) {
  const base =
    "inline-flex min-w-[2.75rem] items-center justify-center rounded-md border px-2.5 py-1.5 text-xs font-bold tracking-wide transition";
  if (active) return `${base} border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--navy)] shadow-sm`;
  if (status === "done") return `${base} border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100`;
  if (status === "na") return `${base} border-border bg-[var(--background)] text-[var(--graphite)]/40 cursor-default`;
  return `${base} border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100`;
}

function TraitementStepButtons({
  stepKeys,
  steps,
  activeStep,
  onStepClick,
  compact,
}: {
  stepKeys: TraitementStepKey[];
  steps: Traitement["steps"];
  activeStep?: TraitementStepKey | null;
  onStepClick?: (stepKey: TraitementStepKey) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      {stepKeys.map((stepKey) => {
        const step = steps[stepKey];
        const status = step?.status ?? "pending";
        const docNo = step?.docNumber?.trim();
        const title = docNo
          ? `${TRAITEMENT_STEP_LABELS[stepKey]} — ${docNo} (${TRAITEMENT_STEP_STATUS_LABELS[status]})`
          : `${TRAITEMENT_STEP_LABELS[stepKey]} — ${TRAITEMENT_STEP_STATUS_LABELS[status]}`;
        return (
          <button
            key={stepKey}
            type="button"
            className={stepButtonClass(status, activeStep === stepKey)}
            title={title}
            disabled={!onStepClick}
            onClick={() => onStepClick?.(stepKey)}
          >
            {TRAITEMENT_STEP_LABELS[stepKey]}
            {status === "done" ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}

function newDraftLineFromProduct(product: Product, stock?: StockItem): DraftLine {
  return {
    key: crypto.randomUUID(),
    productId: product.id,
    stockItemId: stock?.id,
    reference: product.reference,
    designation: product.designation,
    unit: product.unit || "PIECE",
    qty: 1,
    unitPrice: product.unitPrice ?? 0,
  };
}

function newDraftLine(): DraftLine {
  return {
    key: crypto.randomUUID(),
    reference: "",
    designation: "",
    unit: "PIECE",
    qty: 1,
    unitPrice: 0,
  };
}

export function TraitementManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get("type");
  const kind: TraitementType = typeParam === "vente" ? "vente" : "achat";
  const isAchat = kind === "achat";
  const toast = useAdminToast();
  const { projects, depots } = useOpsReferential();
  const [tab, setTab] = useState<"list" | "form">("list");
  const [rows, setRows] = useState<Traitement[]>([]);
  const [articles, setArticles] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [projectId, setProjectId] = useState("");
  const [depotId, setDepotId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<TraitementStatus>("open");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [steps, setSteps] = useState<Traitement["steps"]>({});
  const [activeStep, setActiveStep] = useState<TraitementStepKey | null>(null);
  const [brModalRow, setBrModalRow] = useState<Traitement | null>(null);
  const [brDocNumber, setBrDocNumber] = useState("");
  const [brDocDate, setBrDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [brNotes, setBrNotes] = useState("");
  const [docSheet, setDocSheet] = useState<{ traitement: Traitement; stepKey: TraitementStepKey } | null>(
    null,
  );
  const [immediatePayment, setImmediatePayment] = useState<{
    traitementId: string;
    traitementType: TraitementType;
  } | null>(null);
  const [gasoilBcModal, setGasoilBcModal] = useState<Traitement | null>(null);
  const [gasoilBlModal, setGasoilBlModal] = useState<Traitement | null>(null);
  const [achatToVenteRow, setAchatToVenteRow] = useState<Traitement | null>(null);
  const [financePayRequest, setFinancePayRequest] = useState(false);
  const suppressDeepLinkRef = useRef(false);

  const title = "Traitements";
  const stepKeys = TRAITEMENT_STEPS_BY_TYPE[kind];
  const firstDocStep = stepKeys.find((k) => traitementStepToDocumentType(k, kind)) ?? null;
  const firstDocLabel = firstDocStep ? TRAITEMENT_STEP_LABELS[firstDocStep] : "";
  const partnerLabel = isAchat ? "Fournisseur" : "Client";

  const load = useCallback(async () => {
    setLoading(true);
    const [traitRes, stockRes, productsRes, partnerRes, customersRes] = await Promise.all([
      fetch(`/api/admin/traitements?type=${kind}`, { cache: "no-store" }),
      fetch("/api/admin/stock/items", { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch(isAchat ? "/api/admin/suppliers" : "/api/admin/customers", { cache: "no-store" }),
      isAchat ? fetch("/api/admin/customers", { cache: "no-store" }) : Promise.resolve(null),
    ]);
    if (traitRes.ok) setRows((await traitRes.json()) as Traitement[]);
    if (stockRes.ok) setStockItems((await stockRes.json()) as StockItem[]);
    if (productsRes.ok) setArticles((await productsRes.json()) as Product[]);
    if (partnerRes.ok) {
      const data = (await partnerRes.json()) as Customer[] | Supplier[];
      if (isAchat) setSuppliers(data as Supplier[]);
      else setCustomers(data as Customer[]);
    }
    if (customersRes?.ok) setCustomers((await customersRes.json()) as Customer[]);
    setLoading(false);
  }, [kind, isAchat]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.partnerName.toLowerCase().includes(q),
    );
  }, [rows, search, statusFilter]);

  const statusFilterOptions = useMemo(
    () => withEmptyOption(Object.entries(TRAITEMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })), "Tous"),
    [],
  );

  const openCount = rows.filter((r) => r.status === "open" || r.status === "in_progress").length;

  const stockByProductId = useMemo(() => {
    const map = new Map<string, StockItem>();
    for (const item of stockItems) {
      if (item.productId) map.set(item.productId, item);
    }
    return map;
  }, [stockItems]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of articles) map.set(product.id, product);
    return map;
  }, [articles]);

  const editingRow = editingId ? rows.find((r) => r.id === editingId) : null;

  const draftSupplyKind = useMemo(
    () => inferDraftTraitementSupplyKind(lines, productsById),
    [lines, productsById],
  );

  const isGasoilTraitement =
    editingRow?.supplyKind === "gasoil" || draftSupplyKind === "gasoil";

  function resetForm() {
    setEditingId(null);
    setLabel("");
    setProjectId("");
    setDepotId("");
    setPartnerName("");
    setSupplierId("");
    setCustomerId("");
    setNotes("");
    setStatus("open");
    setLines([]);
    setVatRate(DEFAULT_VAT_RATE);
    setSteps({});
    setActiveStep(null);
  }

  function returnToList() {
    suppressDeepLinkRef.current = true;
    resetForm();
    setTab("list");
    if (searchParams.get("id") || searchParams.get("new")) {
      router.replace(traitementsHref({ type: kind }), { scroll: false });
    }
  }

  function openNew() {
    suppressDeepLinkRef.current = false;
    resetForm();
    setTab("form");
    router.replace(traitementsHref({ type: kind, new: true }), { scroll: false });
  }

  function openEdit(row: Traitement, stepKey?: TraitementStepKey) {
    suppressDeepLinkRef.current = false;
    setEditingId(row.id);
    setLabel(row.label);
    setProjectId(row.projectId ?? "");
    setDepotId(row.depotId ?? "");
    setPartnerName(row.partnerName);
    setSupplierId(row.supplierId ?? "");
    setCustomerId(row.customerId ?? "");
    setNotes(row.notes);
    setStatus(row.status);
    setSteps(row.steps);
    setActiveStep(stepKey ?? TRAITEMENT_STEPS_BY_TYPE[kind][0] ?? null);
    setLines(
      row.lines.length > 0
        ? row.lines.map((line) => ({
            key: line.id,
            productId: line.productId ?? undefined,
            stockItemId: line.stockItemId ?? undefined,
            reference: line.reference,
            designation: line.designation,
            unit: line.unit,
            qty: line.qty,
            unitPrice: line.unitPrice,
          }))
        : [],
    );
    setTab("form");
    router.replace(traitementsHref({ type: kind, id: row.id }), { scroll: false });
  }

  useEffect(() => {
    if (suppressDeepLinkRef.current) {
      suppressDeepLinkRef.current = false;
      return;
    }
    const id = searchParams.get("id");
    if (!id || loading) return;
    const row = rows.find((r) => r.id === id);
    if (row && editingId !== id) {
      openEdit(row);
      return;
    }
    if (rows.length === 0 || row) return;

    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/admin/traitements?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const one = (await res.json()) as Traitement;
      if (one.traitementType !== kind) {
        router.replace(traitementsHref({ type: one.traitementType, id }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, loading, rows, editingId, kind, router]);

  useEffect(() => {
    if (suppressDeepLinkRef.current) return;
    if (loading || searchParams.get("new") !== "1") return;
    if (tab !== "list" || editingId) return;
    openNew();
  }, [loading, searchParams, tab, editingId]);

  function addLineFromProduct(productId: string) {
    const product = articles.find((p) => p.id === productId);
    if (!product) return;
    const stock = stockByProductId.get(productId);
    setLines((prev) => [...prev, newDraftLineFromProduct(product, stock)]);
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.key !== key)));
  }

  function openDocSheet(traitement: Traitement, stepKey: TraitementStepKey) {
    if (stepKey === "br") return;
    if (traitement.supplyKind === "gasoil" && (stepKey === "bc" || stepKey === "bl")) return;
    if (!traitementStepToDocumentType(stepKey, traitement.traitementType)) return;
    setDocSheet({ traitement, stepKey });
  }

  function handleStepClick(row: Traitement, stepKey: TraitementStepKey) {
    if (stepKey === "br") {
      setBrModalRow(row);
      setBrDocNumber(row.steps.br?.docNumber?.trim() || `BR-${row.number}`);
      setBrDocDate(row.steps.br?.docDate || new Date().toISOString().slice(0, 10));
      setBrNotes("");
      return;
    }
    if (stepKey === "bc" && row.supplyKind === "gasoil") {
      setGasoilBcModal(row);
      return;
    }
    if (stepKey === "bl" && row.supplyKind === "gasoil") {
      setGasoilBlModal(row);
      return;
    }
    if (stepKey === "f" && row.steps.f?.status === "done") {
      openDocSheet(row, stepKey);
      setFinancePayRequest(true);
      return;
    }
    openDocSheet(row, stepKey);
  }

  async function refreshTraitementSteps(traitementId: string) {
    const res = await fetch(`/api/admin/traitements?id=${encodeURIComponent(traitementId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const updated = (await res.json()) as Traitement;
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (editingId === updated.id) {
      setSteps(updated.steps);
    }
    setDocSheet((prev) =>
      prev?.traitement.id === updated.id ? { ...prev, traitement: updated } : prev,
    );
    setGasoilBlModal((prev) => (prev?.id === updated.id ? updated : prev));
    setGasoilBcModal((prev) => (prev?.id === updated.id ? updated : prev));
  }

  async function registerBr() {
    if (!brModalRow) return;
    setSaving(true);
    const res = await fetch("/api/admin/traitements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: brModalRow.id,
        registerStep: "br",
        brDocNumber: brDocNumber.trim(),
        brDocDate: brDocDate,
        brNotes: brNotes.trim(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Bon de retour enregistré — stock mis à jour.");
    setBrModalRow(null);
    await load();
  }

  async function save(openDocStep?: TraitementStepKey) {
    if (!label.trim()) {
      toast.error("Indiquez l'objet du traitement.");
      return;
    }
    const payloadLines = lines.filter((l) => l.designation.trim() || (l.reference ?? "").trim());
    if (payloadLines.length === 0) {
      toast.error("Ajoutez au moins un article.");
      return;
    }

    const draftKind = inferDraftTraitementSupplyKind(payloadLines, productsById);
    if (draftKind === "mixed") {
      toast.error(
        "Un traitement ne peut pas mélanger gasoil et articles — créez un traitement séparé pour chaque type.",
      );
      return;
    }

    const gasoilTraitement = editingRow?.supplyKind === "gasoil" || draftKind === "gasoil";
    if (!gasoilTraitement && !depotId.trim()) {
      toast.error("Sélectionnez le dépôt de stock pour ce traitement.");
      return;
    }

    setSaving(true);
    const body = {
      traitementType: kind,
      label,
      projectId: projectId || undefined,
      depotId: depotId || undefined,
      partnerName,
      supplierId: isAchat ? supplierId || undefined : undefined,
      customerId: !isAchat ? customerId || undefined : undefined,
      notes,
      status: editingId ? status : undefined,
      steps: editingId ? steps : undefined,
      lines: payloadLines.map(({ key: _k, ...line }) => line),
    };

    const res = await fetch("/api/admin/traitements", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...body } : body),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }

    const saved = (await res.json()) as Traitement;
    toast.success(editingId ? "Traitement mis à jour." : "Traitement créé.");
    await load();

    if (openDocStep) {
      setEditingId(saved.id);
      setLabel(saved.label);
      setProjectId(saved.projectId ?? "");
      setDepotId(saved.depotId ?? "");
      setPartnerName(saved.partnerName);
      setSupplierId(saved.supplierId ?? "");
      setCustomerId(saved.customerId ?? "");
      setNotes(saved.notes);
      setStatus(saved.status);
      setSteps(saved.steps);
      setLines(
        saved.lines.map((line) => ({
          key: line.id,
          productId: line.productId ?? undefined,
          stockItemId: line.stockItemId ?? undefined,
          reference: line.reference,
          designation: line.designation,
          unit: line.unit,
          qty: line.qty,
          unitPrice: line.unitPrice,
        })),
      );
      setTab("form");
      if (saved.supplyKind === "gasoil" && (openDocStep === "bc" || openDocStep === "bl")) {
        handleStepClick(saved, openDocStep);
      } else {
        openDocSheet(saved, openDocStep);
      }
      return;
    }

    returnToList();
  }

  async function remove(id: string) {
    if (!(await confirmDelete("Supprimer ce traitement ?"))) return;
    const res = await fetch(`/api/admin/traitements?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Traitement supprimé.");
    await load();
  }

  const draftTotal = traitementLineTotal(
    lines.map((l, i) => ({
      id: l.key,
      productId: l.productId ?? null,
      stockItemId: l.stockItemId ?? null,
      reference: l.reference ?? "",
      designation: l.designation,
      unit: l.unit ?? "PIECE",
      qty: l.qty,
      unitPrice: l.unitPrice ?? 0,
      sortOrder: i,
    })),
  );
  const draftTotalTtc = linesTotalTtc(
    lines.map((l) => ({ qty: l.qty, unitPrice: l.unitPrice ?? 0 })),
    vatRate,
  );

  if (loading) {
    return <TraitementsPageSkeleton />;
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title={title}
        description={
          isAchat
            ? "Achat articles — BC, BL, facture. Après réception (BL), passez en traitement vente."
            : "Vente articles — Devis, BL (sortie stock), facture. Peut suivre un traitement achat."
        }
        actions={
          tab === "list" ? (
            <button type="button" className={btnPrimary} onClick={openNew}>
              Nouveau traitement {isAchat ? "achat" : "vente"}
            </button>
          ) : (
            <button
              type="button"
              className={btnSecondary}
              onClick={returnToList}
            >
              Retour liste
            </button>
          )
        }
      />

      <AdminTabs
        tabs={[
          { id: "achat", label: "Achat" },
          { id: "vente", label: "Vente" },
        ]}
        active={kind}
        onChange={(id) => {
          const next = id as TraitementType;
          if (next === kind) return;
          if (tab === "form") {
            returnToList();
          }
          router.replace(traitementsHref({ type: next }));
        }}
      />

      <AdminTabs
        tabs={[
          { id: "list", label: "Liste", badge: rows.length },
          { id: "form", label: editingId ? "Modifier" : "Nouveau" },
        ]}
        active={tab}
        onChange={(id) => {
          if (id === "list") {
            returnToList();
            return;
          }
          if (!editingId) {
            openNew();
            return;
          }
          setTab("form");
        }}
      />

      {tab === "list" ? (
        <div className="space-y-4">
          <AdminMiniStats
            items={[
              { label: "Total", value: String(rows.length) },
              { label: "En cours", value: String(openCount) },
              {
                label: "Terminés",
                value: String(rows.filter((r) => r.status === "completed").length),
              },
            ]}
          />

          <AdminInventoryCard
            title={`Traitements${statusFilter || search ? ` (${filtered.length})` : ""}`}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="N°, objet, partenaire…"
          >
            <div className={filterBarClass}>
              <div className="min-w-0 w-full xl:w-auto xl:min-w-[10rem]">
                <p className={labelClass}>Statut</p>
                <div className="mt-1">
                  <SearchableEnumSelect
                    options={statusFilterOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    inputClassName={filterInputClass}
                    placeholder="Tous"
                  />
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                Aucun traitement. Créez-en un pour suivre vos articles.
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>N°</th>
                    <th className={thClass}>Objet</th>
                    <th className={thClass}>Chantier</th>
                    <th className={thClass}>{partnerLabel}</th>
                    <th className={thClass}>Articles</th>
                    <th className={thClass}>Documents</th>
                    <th className={thClass}>Finance</th>
                    {isAchat ? <th className={thClass}>Vente</th> : null}
                    {!isAchat ? <th className={thClass}>Achat orig.</th> : null}
                    <th className={thClass}>Statut</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const projectName =
                      projects.find((p) => p.id === row.projectId)?.name ?? "—";
                    return (
                      <tr key={row.id} className={rowHover}>
                        <td className={`${tdClass} font-mono text-xs`}>{row.number}</td>
                        <td className={tdTextClass}>
                          <AdminTruncatedText text={row.label} />
                        </td>
                        <td className={tdClass}>
                          <AdminTruncatedText text={projectName} lines={1} />
                        </td>
                        <td className={tdClass}>
                          <AdminTruncatedText text={row.partnerName} lines={1} />
                        </td>
                        <td className={`${tdClass} tabular-nums`}>{row.lines.length}</td>
                        <td className={tdClass}>
                          <TraitementStepButtons
                            stepKeys={stepKeys}
                            steps={row.steps}
                            compact
                            onStepClick={(stepKey) => handleStepClick(row, stepKey)}
                          />
                        </td>
                        <td className={tdClass}>
                          <TraitementFinanceTableCell traitement={row} />
                        </td>
                        {isAchat ? (
                          <td className={tdClass}>
                            {row.venteTraitementId ? (
                              <Link
                                href={traitementsHref({ type: "vente", id: row.venteTraitementId })}
                                className="text-xs text-[var(--navy)] underline underline-offset-2"
                              >
                                Ouvrir vente
                              </Link>
                            ) : canConvertAchatToVente(row) ? (
                              <button
                                type="button"
                                className="text-xs font-medium text-emerald-800 underline underline-offset-2"
                                onClick={() => setAchatToVenteRow(row)}
                              >
                                → Vente
                              </button>
                            ) : (
                              <span className="text-xs text-[var(--graphite)]/50">—</span>
                            )}
                          </td>
                        ) : null}
                        {!isAchat ? (
                          <td className={tdClass}>
                            {row.sourceTraitementId ? (
                              <Link
                                href={traitementsHref({ type: "achat", id: row.sourceTraitementId })}
                                className="text-xs text-[var(--navy)] underline underline-offset-2"
                              >
                                Voir achat
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        ) : null}
                        <td className={tdClass}>{TRAITEMENT_STATUS_LABELS[row.status]}</td>
                        <td className={tdClass}>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className={btnSecondary} onClick={() => openEdit(row)}>
                              Ouvrir
                            </button>
                            <button type="button" className={btnDanger} onClick={() => void remove(row.id)}>
                              Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
        </div>
      ) : (
        <div className="space-y-4">
          <AdminFormCard title={editingId ? "Modifier le traitement" : "Nouveau traitement"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className={labelClass}>Objet *</p>
                <input
                  className={`${inputClass} mt-1`}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={isAchat ? "Ex. Achat pièces criblage chantier X" : "Ex. Vente ciment client Y"}
                />
              </div>
              <div>
                <p className={labelClass}>Chantier</p>
                <div className="mt-1">
                  <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
                </div>
              </div>
              {!isGasoilTraitement ? (
                <div>
                  <p className={labelClass}>Dépôt stock *</p>
                  <div className="mt-1">
                    <DepotSelect depots={depots} value={depotId} onChange={setDepotId} allowEmpty={false} />
                  </div>
                </div>
              ) : null}
              {isGasoilTraitement ? (
                <p className="col-span-full rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-sm text-[var(--navy)]">
                  Achat gasoil : pas de dépôt articles — le stock citerne est mis à jour à la réception (BL).
                </p>
              ) : null}
              <div>
                <p className={labelClass}>{partnerLabel}</p>
                {isAchat ? (
                  <div className="mt-1">
                    <SupplierSelectWithAdd
                      suppliers={suppliers}
                      value={supplierId}
                      onChange={(id, name) => {
                        setSupplierId(id);
                        setPartnerName(name);
                      }}
                      onSupplierAdded={(s) => {
                        setSuppliers((prev) => [...prev, s]);
                        setSupplierId(s.id);
                        setPartnerName(s.name);
                      }}
                      placeholder="— Fournisseur —"
                    />
                  </div>
                ) : (
                  <div className="mt-1">
                    <CustomerSelect
                      customers={customers}
                      value={customerId}
                      onChange={(id) => {
                        setCustomerId(id);
                        const c = customers.find((x) => x.id === id);
                        setPartnerName(c?.name ?? "");
                      }}
                      placeholder="— Client —"
                      inputClassName={inputClass}
                    />
                  </div>
                )}
              </div>
              {editingId ? (
                <div>
                  <p className={labelClass}>Statut</p>
                  <div className="mt-1">
                    <SearchableEnumSelect
                      options={TRAITEMENT_STATUS_LABELS}
                      value={status}
                      onChange={(v) => setStatus(v as TraitementStatus)}
                      inputClassName={inputClass}
                      allowEmpty={false}
                    />
                  </div>
                </div>
              ) : null}
              <div className={editingId ? "" : "sm:col-span-2"}>
                <p className={labelClass}>Notes</p>
                <input className={`${inputClass} mt-1`} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </AdminFormCard>

          <AdminFormCard
            title="Articles"
            hint="Articles du catalogue (Carnet → Produits). Chaque article a un inventaire lié (qté, seuil)."
          >
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <p className={labelClass}>Ajouter depuis le catalogue</p>
                <div className="mt-1">
                  <ProductSelectWithAdd
                    products={articles}
                    value=""
                    resetAfterSelect
                    stockByProductId={stockByProductId}
                    onChange={(id) => addLineFromProduct(id)}
                    onProductAdded={(p) => {
                      setArticles((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
                    }}
                  />
                </div>
              </div>
              <VatRateSelect compact value={vatRate} onChange={setVatRate} label="TVA (%)" />
              <button type="button" className={`${btnSecondary} mt-5`} onClick={() => setLines((p) => [...p, newDraftLine()])}>
                Ligne libre
              </button>
            </div>

            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Réf.</th>
                  <th className={thClass}>Désignation</th>
                  <th className={thClass}>Unité</th>
                  <th className={thClass}>Qté</th>
                  <th className={thClass}>P.U. HT / TTC</th>
                  <th className={thClass}>Total HT / TTC</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.key}>
                    <td className={tdClass}>
                      <input
                        className={inputClass}
                        value={line.reference ?? ""}
                        onChange={(e) => updateLine(line.key, { reference: e.target.value })}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        className={inputClass}
                        value={line.designation}
                        onChange={(e) => updateLine(line.key, { designation: e.target.value })}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        className={`${inputClass} w-20`}
                        value={line.unit ?? (isGasoilTraitement ? GASOIL_UNIT : "PIECE")}
                        readOnly={isGasoilTraitement}
                        onChange={(e) => updateLine(line.key, { unit: e.target.value })}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-24`}
                        value={line.qty}
                        onChange={(e) => updateLine(line.key, { qty: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className={`${tdClass} min-w-[11rem]`}>
                      <HtTtcPriceFields
                        vatRate={vatRate}
                        valueHt={line.unitPrice ?? 0}
                        onChangeHt={(unitPrice) => updateLine(line.key, { unitPrice })}
                        compact
                        showLabels={false}
                      />
                    </td>
                    <td className={`${tdClass} tabular-nums whitespace-nowrap`}>
                      <span className="block">{formatMoney((line.qty || 0) * (line.unitPrice || 0))}</span>
                      <span className="block text-[10px] text-[var(--graphite)]/70">
                        {formatMoney(lineTotalTtc(line.qty || 0, line.unitPrice || 0, vatRate))}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <button type="button" className={btnDanger} onClick={() => removeLine(line.key)}>
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
            <p className="mt-3 text-sm font-medium text-[var(--navy)]">
              Total HT : {formatMoney(draftTotal)} · TTC ({vatRate} %) : {formatMoney(draftTotalTtc)}
            </p>
          </AdminFormCard>

          {editingId && isAchat ? (() => {
            const row = rows.find((r) => r.id === editingId);
            if (!row) return null;
            if (row.venteTraitementId) {
              return (
                <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
                  Traitement vente lié :{" "}
                  <Link
                    href={traitementsHref({ type: "vente", id: row.venteTraitementId })}
                    className="font-medium underline underline-offset-2"
                  >
                    Ouvrir la vente
                  </Link>
                </p>
              );
            }
            if (canConvertAchatToVente(row)) {
              return (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                  BL enregistré —{" "}
                  <button
                    type="button"
                    className="font-medium underline underline-offset-2"
                    onClick={() => setAchatToVenteRow(row)}
                  >
                    Créer le traitement vente
                  </button>{" "}
                  (mêmes articles → Devis → BL → Facture).
                </p>
              );
            }
            return null;
          })() : null}

          {editingId && !isAchat ? (() => {
            const row = rows.find((r) => r.id === editingId);
            if (!row?.sourceTraitementId) return null;
            return (
              <p className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-sm text-[var(--navy)]">
                Suite du traitement achat :{" "}
                <Link
                  href={traitementsHref({ type: "achat", id: row.sourceTraitementId })}
                  className="font-medium underline underline-offset-2"
                >
                  Voir l&apos;achat d&apos;origine
                </Link>
              </p>
            );
          })() : null}

          {editingId ? (
            <AdminFormCard
              title="Documents"
              hint={
                isGasoilTraitement
                  ? "Gasoil : BC (bon commande gasoil) → Réception (BL, stock citerne) → Facture (finance auto)."
                  : "Cliquez une étape pour la création rapide (popup). BL et BR mettent à jour le stock. Mode avancé disponible dans la popup."
              }
            >
              <TraitementStepButtons
                stepKeys={stepKeys}
                steps={steps}
                activeStep={activeStep}
                onStepClick={(stepKey) => {
                  setActiveStep(stepKey);
                  const row = editingRow;
                  const supplyKind = row?.supplyKind ?? (draftSupplyKind === "gasoil" ? "gasoil" : "articles");
                  const traitement: Traitement = row
                    ? { ...row, steps }
                    : {
                        id: editingId,
                        traitementType: kind,
                        supplyKind,
                        number: "",
                        label,
                        projectId: projectId || null,
                        depotId: depotId || null,
                        supplierId: supplierId || null,
                        customerId: customerId || null,
                        partnerName,
                        status,
                        notes,
                        steps,
                        purchaseRequestId: null,
                        sourceTraitementId: null,
                        venteTraitementId: null,
                        lines: lines.map((l, i) => ({
                          id: l.key,
                          productId: l.productId ?? null,
                          stockItemId: l.stockItemId ?? null,
                          reference: l.reference ?? "",
                          designation: l.designation,
                          unit: l.unit ?? "PIECE",
                          qty: l.qty,
                          unitPrice: l.unitPrice ?? 0,
                          sortOrder: i,
                        })),
                        createdAt: "",
                        updatedAt: "",
                      };
                  handleStepClick(traitement, stepKey);
                }}
              />
              {stepKeys.map((stepKey) => {
                const step = steps[stepKey];
                if (!step?.docNumber?.trim()) return null;
                return (
                  <p key={stepKey} className="mt-2 text-xs text-[var(--graphite)]/70">
                    {TRAITEMENT_STEP_LABELS[stepKey]} : {step.docNumber}
                    {step.status === "done" ? " (fait)" : ""}
                  </p>
                );
              })}
            </AdminFormCard>
          ) : (
            <AdminFormCard
              title="Documents"
              hint={`Enregistrez le traitement puis créez ${firstDocLabel} en un clic, ou suivez ${stepKeys.map((k) => TRAITEMENT_STEP_LABELS[k]).join(" → ")}.`}
            >
              <TraitementStepButtons stepKeys={stepKeys} steps={{}} />
              <p className="mt-3 text-sm text-[var(--graphite)]/70">
                Les documents seront disponibles après enregistrement — création rapide via popup ou mode avancé
                (quote builder).
              </p>
            </AdminFormCard>
          )}

          {editingId && steps.f?.status === "done" ? (() => {
            const row = rows.find((r) => r.id === editingId);
            if (!row) return null;
            return (
              <TraitementFinancePanel
                traitement={{ ...row, steps }}
                requestPaymentOpen={financePayRequest}
                onPaymentOpenHandled={() => setFinancePayRequest(false)}
              />
            );
          })() : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer le traitement"}
            </button>
            {firstDocStep ? (
              <button
                type="button"
                className={btnSecondary}
                disabled={saving}
                onClick={() => void save(firstDocStep)}
              >
                {saving
                  ? "Enregistrement…"
                  : editingId
                    ? `Enregistrer et ${firstDocLabel}`
                    : `Créer et ${firstDocLabel}`}
              </button>
            ) : null}
            <button type="button" className={btnSecondary} onClick={returnToList}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <TraitementAchatToVenteSheet
        open={Boolean(achatToVenteRow)}
        traitement={achatToVenteRow}
        customers={customers}
        onClose={() => setAchatToVenteRow(null)}
        onCreated={async (venteId) => {
          toast.success("Traitement vente créé — Devis, BL, facture.");
          await load();
          router.push(traitementsHref({ type: "vente", id: venteId }));
        }}
        onError={(message) => toast.error(message)}
      />

      <TraitementDocumentQuickSheet
        open={Boolean(docSheet)}
        traitement={docSheet?.traitement ?? null}
        stepKey={docSheet?.stepKey ?? null}
        onClose={() => setDocSheet(null)}
        onSaved={async () => {
          const id = docSheet?.traitement.id ?? editingId;
          await load();
          if (id) await refreshTraitementSteps(id);
        }}
        onError={(message) => toast.error(message)}
        onSuccess={(message) => toast.success(message)}
        onFactureSaved={(traitementId, traitementType) => {
          setImmediatePayment({ traitementId, traitementType });
        }}
      />

      <TraitementImmediatePaymentPrompt
        open={Boolean(immediatePayment)}
        traitementId={immediatePayment?.traitementId ?? ""}
        traitementType={immediatePayment?.traitementType ?? kind}
        onClose={() => setImmediatePayment(null)}
        onDone={() => void load()}
      />

      <TraitementGasoilCommandeSheet
        open={Boolean(gasoilBcModal)}
        traitement={gasoilBcModal}
        projects={projects}
        onClose={() => setGasoilBcModal(null)}
        onSaved={async () => {
          const id = gasoilBcModal?.id ?? editingId;
          await load();
          if (id) await refreshTraitementSteps(id);
        }}
        onError={(message) => toast.error(message)}
        onSuccess={(message) => toast.success(message)}
      />

      <TraitementGasoilReceptionSheet
        open={Boolean(gasoilBlModal)}
        traitement={gasoilBlModal}
        onClose={() => setGasoilBlModal(null)}
        onSaved={async () => {
          const id = gasoilBlModal?.id ?? editingId;
          await load();
          if (id) await refreshTraitementSteps(id);
        }}
        onError={(message) => toast.error(message)}
        onSuccess={(message) => toast.success(message)}
      />

      <AdminDataSheet
        open={Boolean(brModalRow)}
        onClose={() => setBrModalRow(null)}
        title="Bon de retour (BR)"
        description={
          brModalRow
            ? `Traitement ${brModalRow.number} — enregistrement et retour stock automatique.`
            : undefined
        }
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setBrModalRow(null)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void registerBr()}>
              {saving ? "Enregistrement…" : "Enregistrer BR"}
            </button>
          </>
        }
      >
        <AdminSheetField label="N° BR" required>
          <input
            className={inputClass}
            value={brDocNumber}
            onChange={(e) => setBrDocNumber(e.target.value)}
          />
        </AdminSheetField>
        <AdminSheetField label="Date" required className="mt-3">
          <input
            type="date"
            className={inputClass}
            value={brDocDate}
            onChange={(e) => setBrDocDate(e.target.value)}
          />
        </AdminSheetField>
        <AdminSheetField label="Notes" className="mt-3">
          <input className={inputClass} value={brNotes} onChange={(e) => setBrNotes(e.target.value)} />
        </AdminSheetField>
      </AdminDataSheet>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
