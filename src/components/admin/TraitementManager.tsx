"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SupplierSelectWithAdd } from "@/components/admin/SupplierSelectWithAdd";
import type { StockItem } from "@/components/admin/operations-types";
import type { Customer } from "@/components/admin/devis-types";
import type { Product, Supplier } from "@/components/admin/devis-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import { formatMoney } from "@/lib/admin/price-ht-ttc";
import { TraitementAchatToVenteSheet, canConvertAchatToVente } from "@/components/admin/TraitementAchatToVenteSheet";
import { TraitementDocumentQuickSheet } from "@/components/admin/TraitementDocumentQuickSheet";
import { TraitementGasoilCommandeSheet } from "@/components/admin/TraitementGasoilCommandeSheet";
import { TraitementGasoilReceptionSheet } from "@/components/admin/TraitementGasoilReceptionSheet";
import { traitementStepToDocumentType } from "@/lib/admin/traitement-document";
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

export function TraitementManager({ kind }: { kind: TraitementType }) {
  const isAchat = kind === "achat";
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useAdminToast();
  const { projects } = useOpsReferential();
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
  const [partnerName, setPartnerName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<TraitementStatus>("open");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [steps, setSteps] = useState<Traitement["steps"]>({});
  const [activeStep, setActiveStep] = useState<TraitementStepKey | null>(null);
  const [brModalRow, setBrModalRow] = useState<Traitement | null>(null);
  const [brDocNumber, setBrDocNumber] = useState("");
  const [brDocDate, setBrDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [brNotes, setBrNotes] = useState("");
  const [docSheet, setDocSheet] = useState<{ traitement: Traitement; stepKey: TraitementStepKey } | null>(
    null,
  );
  const [gasoilBcModal, setGasoilBcModal] = useState<Traitement | null>(null);
  const [gasoilBlModal, setGasoilBlModal] = useState<Traitement | null>(null);
  const [achatToVenteRow, setAchatToVenteRow] = useState<Traitement | null>(null);

  const title = isAchat ? "Traitement d'achat" : "Traitement de vente";
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

  const openCount = rows.filter((r) => r.status === "open" || r.status === "in_progress").length;

  const stockByProductId = useMemo(() => {
    const map = new Map<string, StockItem>();
    for (const item of stockItems) {
      if (item.productId) map.set(item.productId, item);
    }
    return map;
  }, [stockItems]);

  function resetForm() {
    setEditingId(null);
    setLabel("");
    setProjectId("");
    setPartnerName("");
    setSupplierId("");
    setCustomerId("");
    setNotes("");
    setStatus("open");
    setLines([]);
    setSteps({});
    setActiveStep(null);
  }

  function openNew() {
    resetForm();
    setTab("form");
  }

  function openEdit(row: Traitement, stepKey?: TraitementStepKey) {
    setEditingId(row.id);
    setLabel(row.label);
    setProjectId(row.projectId ?? "");
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
  }

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || loading || rows.length === 0) return;
    const row = rows.find((r) => r.id === id);
    if (row && editingId !== id) {
      openEdit(row);
    }
  }, [searchParams, loading, rows, editingId, kind]);

  useEffect(() => {
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

    setSaving(true);
    const body = {
      traitementType: kind,
      label,
      projectId: projectId || undefined,
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
      openDocSheet(saved, openDocStep);
      return;
    }

    resetForm();
    setTab("list");
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

  if (loading) {
    return (
      <div className={moduleWrap}>
        <OpsModuleHeader title={title} description="Chargement…" />
        <AdminLoading />
      </div>
    );
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
              Nouveau traitement
            </button>
          ) : (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                resetForm();
                setTab("list");
              }}
            >
              Retour liste
            </button>
          )
        }
      />

      <AdminTabs
        tabs={[
          { id: "list", label: "Liste", badge: rows.length },
          { id: "form", label: editingId ? "Modifier" : "Nouveau" },
        ]}
        active={tab}
        onChange={(id) => {
          if (id === "list") {
            resetForm();
          }
          setTab(id as "list" | "form");
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
            <div className="flex flex-wrap items-end gap-2 border-b border-border px-4 py-3">
              <div>
                <p className={labelClass}>Statut</p>
                <select
                  className={`${inputClass} mt-1 min-w-[140px]`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tous</option>
                  {(Object.keys(TRAITEMENT_STATUS_LABELS) as TraitementStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {TRAITEMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
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
                        <td className={tdClass}>{row.label}</td>
                        <td className={tdClass}>{projectName}</td>
                        <td className={tdClass}>{row.partnerName || "—"}</td>
                        <td className={`${tdClass} tabular-nums`}>{row.lines.length}</td>
                        <td className={tdClass}>
                          <TraitementStepButtons
                            stepKeys={stepKeys}
                            steps={row.steps}
                            compact
                            onStepClick={(stepKey) => handleStepClick(row, stepKey)}
                          />
                        </td>
                        {isAchat ? (
                          <td className={tdClass}>
                            {row.venteTraitementId ? (
                              <Link
                                href={`/admin/traitements-vente?id=${encodeURIComponent(row.venteTraitementId)}`}
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
                                href={`/admin/traitements-achat?id=${encodeURIComponent(row.sourceTraitementId)}`}
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
              <div>
                <p className={labelClass}>{partnerLabel}</p>
                {isAchat ? (
                  <div className="mt-1">
                    <SupplierSelectWithAdd
                      suppliers={suppliers}
                      supplyType="divers"
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
                  <select
                    className={`${inputClass} mt-1`}
                    value={customerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCustomerId(id);
                      const c = customers.find((x) => x.id === id);
                      setPartnerName(c?.name ?? "");
                    }}
                  >
                    <option value="">— Client —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {editingId ? (
                <div>
                  <p className={labelClass}>Statut</p>
                  <select
                    className={`${inputClass} mt-1`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TraitementStatus)}
                  >
                    {(Object.keys(TRAITEMENT_STATUS_LABELS) as TraitementStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {TRAITEMENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
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
            hint="Articles du catalogue (Carnet → Produits). Chaque article a un inventaire lié (qté, seuil). Créez d'abord l'article dans le catalogue si besoin."
          >
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[220px] flex-1">
                <p className={labelClass}>Ajouter depuis le catalogue</p>
                <select
                  className={`${inputClass} mt-1`}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addLineFromProduct(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">— Choisir un article —</option>
                  {articles.map((product) => {
                    const stock = stockByProductId.get(product.id);
                    return (
                      <option key={product.id} value={product.id}>
                        {product.reference ? `${product.reference} — ` : ""}
                        {product.designation}
                        {stock ? ` · stock ${stock.qty}` : " · stock 0"}
                      </option>
                    );
                  })}
                </select>
              </div>
              <Link href="/admin/products" className={`${btnSecondary} mt-5`}>
                + Nouvel article
              </Link>
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
                  <th className={thClass}>P.U.</th>
                  <th className={thClass}>Total</th>
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
                        value={line.unit ?? "PIECE"}
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
                    <td className={tdClass}>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={`${inputClass} w-28`}
                        value={line.unitPrice ?? 0}
                        onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className={`${tdClass} tabular-nums`}>
                      {formatMoney((line.qty || 0) * (line.unitPrice || 0))}
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
            <p className="mt-3 text-sm font-medium text-[var(--navy)]">Total HT : {formatMoney(draftTotal)}</p>
          </AdminFormCard>

          {editingId && isAchat ? (() => {
            const row = rows.find((r) => r.id === editingId);
            if (!row) return null;
            if (row.venteTraitementId) {
              return (
                <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
                  Traitement vente lié :{" "}
                  <Link
                    href={`/admin/traitements-vente?id=${encodeURIComponent(row.venteTraitementId)}`}
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
                  href={`/admin/traitements-achat?id=${encodeURIComponent(row.sourceTraitementId)}`}
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
                rows.find((r) => r.id === editingId)?.supplyKind === "gasoil"
                  ? "Gasoil : BC (bon commande gasoil) → Réception (BL, stock citerne) → Facture."
                  : "Cliquez une étape pour la création rapide (popup). BL et BR mettent à jour le stock. Mode avancé disponible dans la popup."
              }
            >
              <TraitementStepButtons
                stepKeys={stepKeys}
                steps={steps}
                activeStep={activeStep}
                onStepClick={(stepKey) => {
                  setActiveStep(stepKey);
                  const row = rows.find((r) => r.id === editingId);
                  const traitement: Traitement = row
                    ? { ...row, steps }
                    : {
                        id: editingId,
                        traitementType: kind,
                        supplyKind: "articles",
                        number: "",
                        label,
                        projectId: projectId || null,
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
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                resetForm();
                setTab("list");
              }}
            >
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
          router.push(`/admin/traitements-vente?id=${encodeURIComponent(venteId)}`);
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
