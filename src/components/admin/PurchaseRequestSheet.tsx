"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product } from "@/components/admin/devis-types";
import {
  PURCHASE_CATEGORY_LABELS,
  type AdminProject,
  type PurchaseCategory,
  type PurchaseRequest,
  type PurchaseRequestLine,
  type PurchaseRequestStatus,
  type StockItem,
} from "@/components/admin/operations-types";
import {
  btnDanger,
  btnLinkDanger,
  btnLinkSuccess,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  inputClassDense,
  inventoryTableClass,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { ProductSelectWithAdd } from "@/components/admin/ProductSelectWithAdd";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { PurchaseStatusBadge } from "@/components/admin/StatusBadge";
import { downloadPurchaseRequestPdf } from "@/components/admin/purchase-request-pdf";
import type { PurchaseRequestDaKind } from "@/components/admin/PurchaseRequestKindPickerSheet";
import { AdminDataSheet, ADMIN_DATA_SHEET_WIDTH_WIDE, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";
import { isGasoilPurchaseRequest } from "@/lib/admin/map-purchase-request";
import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";
import {
  emptyPurchaseRequestLine,
} from "@/lib/admin/map-purchase-request-lines";
import { traitementsHref } from "@/lib/admin/traitement-nav";

type CreateProps = {
  mode: "create";
  daKind: PurchaseRequestDaKind;
  open: boolean;
  onClose: () => void;
  projects: AdminProject[];
  products: Product[];
  initial?: Partial<{
    projectId: string;
    reference: string;
    designation: string;
    stockItemId: string;
    productId: string;
    unitPrice: number;
  }>;
  onCreated: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

type ViewProps = {
  mode: "view";
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest | null;
  projects: AdminProject[];
  onChanged: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export type PurchaseRequestSheetProps = CreateProps | ViewProps;

export function PurchaseRequestSheet(props: PurchaseRequestSheetProps) {
  if (props.mode === "create") {
    return <CreateSheet {...props} />;
  }
  return <ViewSheet {...props} />;
}

function CreateSheet(props: CreateProps) {
  if (props.daKind === "gasoil") return <GasoilCreateSheet {...props} />;
  return <ArticlesCreateSheet {...props} />;
}

function ArticlesCreateSheet({
  open,
  onClose,
  projects,
  products,
  initial,
  onCreated,
  onSuccess,
  onError,
}: CreateProps) {
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [category, setCategory] = useState<PurchaseCategory>("parts");
  const [subject, setSubject] = useState("");
  const [lines, setLines] = useState<PurchaseRequestLine[]>([emptyPurchaseRequestLine()]);
  const [supplier, setSupplier] = useState("");
  const [urgency, setUrgency] = useState("Normale");
  const [requester, setRequester] = useState("");
  const [justification, setJustification] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [catalogProducts, setCatalogProducts] = useState(products);

  useEffect(() => {
    setCatalogProducts(products);
  }, [products]);

  useEffect(() => {
    if (!open) return;
    setProjectId(initial?.projectId ?? "");
    const prefill = emptyPurchaseRequestLine();
    if (initial?.reference) prefill.reference = initial.reference;
    if (initial?.designation) prefill.designation = initial.designation;
    if (initial?.productId) prefill.productId = initial.productId;
    if (initial?.stockItemId) prefill.stockItemId = initial.stockItemId;
    if (initial?.unitPrice) prefill.unitPrice = initial.unitPrice;
    setLines([prefill]);
    if (initial?.designation) {
      setSubject(`Réappro — ${initial.designation}`);
    } else if (initial?.reference) {
      setSubject(`Réappro — ${initial.reference}`);
    } else {
      setSubject("");
    }
  }, [open, initial]);

  function patchLine(index: number, patch: Partial<PurchaseRequestLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function pickProduct(index: number, id: string) {
    const p = catalogProducts.find((x) => x.id === id);
    if (!p) {
      patchLine(index, { productId: null });
      return;
    }
    patchLine(index, {
      productId: p.id,
      reference: p.reference,
      designation: p.designation,
      unit: p.unit || "PIECE",
    });
    if (!subject.trim()) setSubject(`Réappro — ${p.designation}`);
  }

  function addLine() {
    setLines((prev) => [...prev, emptyPurchaseRequestLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function submit() {
    const validLines = lines.filter((l) => (l.designation.trim() || l.reference.trim()) && l.qty > 0);
    if (validLines.length === 0) {
      onError("Ajoutez au moins un article avec désignation et quantité.");
      return;
    }
    if (!subject.trim() && validLines.length === 1 && !validLines[0]!.designation.trim()) {
      onError("Indiquez l'objet ou la désignation.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        subject:
          subject.trim() ||
          (validLines.length > 1
            ? `Réappro — ${validLines.length} articles`
            : `Réappro — ${validLines[0]!.designation.trim() || validLines[0]!.reference.trim()}`),
        lines: validLines.map((l) => ({
          reference: l.reference,
          designation: l.designation,
          unit: l.unit,
          productId: l.productId || undefined,
          stockItemId: l.stockItemId || undefined,
          qty: l.qty,
          unitPrice: 0,
        })),
        supplier,
        urgency,
        requester,
        justification,
        deliveryDate: deliveryDate || undefined,
        projectId: projectId || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }
    onSuccess("Demande d'achat soumise — en attente de validation.");
    await onCreated();
    onClose();
  }

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title="Nouvelle DA — Articles"
      description="Pièces, consommables, matériaux — plusieurs lignes possibles."
      width={ADMIN_DATA_SHEET_WIDTH_WIDE}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
            {saving ? "Envoi…" : "Soumettre la DA"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={formGridClass}>
          <AdminSheetField label="Projet / chantier" className="sm:col-span-2">
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
          </AdminSheetField>
          <AdminSheetField label="Catégorie">
            <SearchableEnumSelect
              options={PURCHASE_CATEGORY_LABELS}
              value={category}
              onChange={(v) => setCategory(v as PurchaseCategory)}
              inputClassName={inputClass}
              allowEmpty={false}
            />
          </AdminSheetField>
          <AdminSheetField label="Objet" className="sm:col-span-2">
            <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. Réappro chantier EL WATIA" />
          </AdminSheetField>
          <AdminSheetField label="Fournisseur suggéré">
            <input className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </AdminSheetField>
          <AdminSheetField label="Urgence">
            <input className={inputClass} value={urgency} onChange={(e) => setUrgency(e.target.value)} />
          </AdminSheetField>
          <AdminSheetField label="Demandeur">
            <input className={inputClass} value={requester} onChange={(e) => setRequester(e.target.value)} />
          </AdminSheetField>
          <AdminSheetField label="Livraison souhaitée">
            <input
              type="date"
              className={inputClass}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </AdminSheetField>
          <AdminSheetField label="Justification" className="sm:col-span-2">
            <textarea
              className={inputClass}
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </AdminSheetField>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]/70">Articles</p>
            <button type="button" className={btnSecondary} onClick={addLine}>
              + Ligne
            </button>
          </div>
          <div className="overflow-x-auto touch-pan-x overscroll-x-contain rounded-lg border border-border">
            <table className={`${inventoryTableClass} table-fixed min-w-[720px]`}>
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[12%]" />
                <col className="w-[36%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[3%]" />
              </colgroup>
              <thead className="bg-[var(--background)]">
                <tr>
                  <th className={thClass}>Catalogue</th>
                  <th className={thClass}>Réf.</th>
                  <th className={thClass}>Désignation</th>
                  <th className={thClass}>Unité</th>
                  <th className={`${thClass} text-right`}>Qté</th>
                  <th className={thClass} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                      <td className={`${tdClass} min-w-0`}>
                        <ProductSelectWithAdd
                          products={catalogProducts}
                          value={line.productId ?? ""}
                          onChange={(id) => pickProduct(index, id)}
                          onProductAdded={(p) => {
                            setCatalogProducts((prev) =>
                              prev.some((x) => x.id === p.id) ? prev : [...prev, p],
                            );
                          }}
                          placeholder="— Optionnel —"
                          compact
                        />
                      </td>
                      <td className={`${tdClass} min-w-0`}>
                        <input
                          className={inputClassDense}
                          value={line.reference}
                          onChange={(e) => patchLine(index, { reference: e.target.value })}
                        />
                      </td>
                      <td className={`${tdClass} min-w-0`}>
                        <input
                          className={inputClassDense}
                          value={line.designation}
                          onChange={(e) => patchLine(index, { designation: e.target.value })}
                        />
                      </td>
                      <td className={tdClass}>
                        <input
                          className={inputClassDense}
                          value={line.unit}
                          onChange={(e) => patchLine(index, { unit: e.target.value })}
                        />
                      </td>
                      <td className={tdClass}>
                        <input
                          type="number"
                          min={0}
                          className={`${inputClassDense} text-right tabular-nums`}
                          value={line.qty}
                          onChange={(e) => patchLine(index, { qty: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className={`${tdClass} text-center`}>
                        <button
                          type="button"
                          className={btnDanger}
                          disabled={lines.length <= 1}
                          onClick={() => removeLine(index)}
                          aria-label="Supprimer la ligne"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminDataSheet>
  );
}

function GasoilCreateSheet({
  open,
  onClose,
  projects,
  initial,
  onCreated,
  onSuccess,
  onError,
}: CreateProps) {
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [pumpMeter, setPumpMeter] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [requester, setRequester] = useState("");
  const [supplier, setSupplier] = useState("");
  const [gasoilStock, setGasoilStock] = useState<StockItem | null>(null);

  useEffect(() => {
    if (!open) return;
    setProjectId(initial?.projectId ?? "");
    setPumpMeter("");
    setQty("");
    setDeliveryDate("");
    setRequester("");
    setSupplier("");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/admin/fuel/stock", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { item: StockItem | null } | null) => setGasoilStock(data?.item ?? null))
      .catch(() => setGasoilStock(null));
  }, [open]);

  async function submit() {
    if (!projectId) {
      onError("Sélectionnez un chantier.");
      return;
    }
    if (!deliveryDate) {
      onError("Indiquez la date de livraison.");
      return;
    }
    const litres = typeof qty === "number" ? qty : Number(qty);
    if (!litres || litres <= 0) {
      onError("Indiquez la quantité demandée (litres).");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "gasoil",
        projectId,
        qty: litres,
        unit: GASOIL_UNIT,
        deliveryDate,
        requester,
        supplier,
        pumpMeter: pumpMeter.trim() ? Number(pumpMeter) : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as PurchaseRequest;
    onSuccess(`DA gasoil soumise : ${created.number}`);
    await onCreated();
    onClose();
  }

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title="Nouvelle DA — Gasoil"
      description="Réapprovisionnement carburant — validation puis traitement BC → réception → facture."
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
            {saving ? "Envoi…" : "Soumettre la DA"}
          </button>
        </>
      }
    >
      <div className={formGridClass}>
        <AdminSheetField label="Chantier" required className="sm:col-span-2">
          <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
        </AdminSheetField>
        <AdminSheetField label="Stock actuel (citerne)" className="sm:col-span-2">
          <input
            className={`${inputClass} bg-[var(--background)]`}
            readOnly
            value={
              gasoilStock
                ? `${gasoilStock.qty.toLocaleString("fr-FR")} L — ${gasoilStock.reference || gasoilStock.designation}`
                : ""
            }
            placeholder="Aucun gasoil en stock"
          />
        </AdminSheetField>
        <AdminSheetField label="Compteur pompe">
          <input
            type="number"
            className={inputClass}
            placeholder="Relevé compteur"
            value={pumpMeter}
            onChange={(e) => setPumpMeter(e.target.value)}
          />
        </AdminSheetField>
        <AdminSheetField label="Quantité demandée (L)" required>
          <input
            type="number"
            min={0}
            className={inputClass}
            placeholder="Litres"
            value={qty}
            onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value) || 0)}
          />
        </AdminSheetField>
        <AdminSheetField label="Date de livraison" required>
          <input
            type="date"
            className={inputClass}
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </AdminSheetField>
        <AdminSheetField label="Fournisseur suggéré">
          <input
            className={inputClass}
            placeholder="Ex. EL WATIA TAN TAN"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </AdminSheetField>
        <AdminSheetField label="Demandeur">
          <input className={inputClass} value={requester} onChange={(e) => setRequester(e.target.value)} />
        </AdminSheetField>
        <p className="sm:col-span-2 text-xs text-[var(--graphite)]/65">
          Numéro généré à l&apos;enregistrement (ex. DA-GASOIL-2026-001).
        </p>
      </div>
    </AdminDataSheet>
  );
}

function ViewSheet({
  open,
  onClose,
  request,
  projects,
  onChanged,
  onSuccess,
  onError,
}: ViewProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  if (!request) return null;

  const projectName = projects.find((p) => p.id === request.projectId)?.name;
  const isGasoil = isGasoilPurchaseRequest(request);
  const canApprove = request.status === "pending";
  const canConvert = request.status === "approved" && !request.traitementId;

  async function setStatus(status: PurchaseRequestStatus) {
    if (status === "rejected") {
      const ok = await confirmDelete(request!.number, {
        title: "Rejeter la demande",
        description: `Rejeter la DA « ${request!.number} » ?`,
        confirmLabel: "Rejeter",
        cancelLabel: "Annuler",
      });
      if (!ok) return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/purchase-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: request!.id, status }),
    });
    setSaving(false);
    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }
    onSuccess(status === "approved" ? "DA approuvée." : "DA rejetée.");
    await onChanged();
    if (status === "rejected") onClose();
  }

  async function convertToTraitement() {
    setSaving(true);
    const res = await fetch(`/api/admin/purchase-requests/${encodeURIComponent(request!.id)}/traitement`, {
      method: "POST",
    });
    setSaving(false);
    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }
    const { traitementId } = (await res.json()) as { traitementId: string };
    onSuccess("Traitement achat créé — vous pouvez générer BC, BL, facture.");
    await onChanged();
    onClose();
    router.push(traitementsHref({ type: "achat", id: traitementId }));
  }

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title={`DA ${request.number}`}
      description={request.subject}
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            className={btnSecondary}
            disabled={saving}
            onClick={() => void downloadPurchaseRequestPdf(request, projectName)}
          >
            Télécharger PDF
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
              Fermer
            </button>
            {canApprove ? (
              <>
                <button
                  type="button"
                  className={btnLinkSuccess}
                  disabled={saving}
                  onClick={() => void setStatus("approved")}
                >
                  Approuver
                </button>
                <button
                  type="button"
                  className={btnLinkDanger}
                  disabled={saving}
                  onClick={() => void setStatus("rejected")}
                >
                  Rejeter
                </button>
              </>
            ) : null}
            {canConvert ? (
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void convertToTraitement()}>
                {saving ? "Création…" : "Créer traitement achat"}
              </button>
            ) : null}
            {request.traitementId ? (
              <Link
                href={traitementsHref({ type: "achat", id: request.traitementId })}
                className={btnPrimary}
                onClick={onClose}
              >
                Ouvrir traitement
              </Link>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <PurchaseStatusBadge status={request.status} />
          <span className="text-[var(--graphite)]/70">
            {isGasoil ? "Gasoil" : PURCHASE_CATEGORY_LABELS[request.category]}
          </span>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Chantier" value={projectName || "—"} />
          <Field label="Demandeur" value={request.requester || "—"} />
          <Field label="Fournisseur" value={request.supplier || "—"} />
          {!isGasoil ? <Field label="Urgence" value={request.urgency || "—"} /> : null}
          <Field label="Livraison" value={request.deliveryDate || "—"} />
          {isGasoil && request.stockQtyAtRequest != null ? (
            <Field label="Stock au moment de la DA" value={`${request.stockQtyAtRequest.toLocaleString("fr-FR")} L`} />
          ) : null}
          {isGasoil && request.pumpMeter != null ? (
            <Field label="Compteur pompe" value={request.pumpMeter.toLocaleString("fr-FR")} />
          ) : null}
          <Field label="Créée le" value={new Date(request.createdAt).toLocaleDateString("fr-FR")} />
          {request.approvedAt ? (
            <Field label="Approuvée le" value={new Date(request.approvedAt).toLocaleDateString("fr-FR")} />
          ) : null}
        </dl>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--background)]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Réf.</th>
                <th className="px-3 py-2 text-left font-semibold">Désignation</th>
                <th className="px-3 py-2 text-left font-semibold">Unité</th>
                <th className="px-3 py-2 text-right font-semibold">Qté</th>
              </tr>
            </thead>
            <tbody>
              {(request.lines?.length ? request.lines : [{
                reference: request.reference,
                designation: request.designation || request.subject,
                unit: request.unit,
                qty: request.qty,
                unitPrice: request.unitPrice,
              }]).map((line, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{line.reference || "—"}</td>
                  <td className="px-3 py-2">{line.designation || request.subject}</td>
                  <td className="px-3 py-2">{isGasoil ? GASOIL_UNIT : line.unit || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{line.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {request.justification ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]/70">Justification</p>
            <p className="mt-1 whitespace-pre-wrap text-[var(--graphite)]/90">{request.justification}</p>
          </div>
        ) : null}
        {request.status === "approved" && !request.traitementId ? (
          <p className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-[var(--navy)]">
            {isGasoil ? (
              <>
                DA gasoil approuvée — lancez un <strong>traitement achat</strong> pour enchaîner{" "}
                <strong>BC → Réception gasoil → Facture</strong> (stock citerne mis à jour à la réception).
              </>
            ) : (
              <>
                DA approuvée — lancez un <strong>traitement achat</strong> pour enchaîner BC → BL → Facture
                comme d&apos;habitude.
              </>
            )}
          </p>
        ) : null}
      </div>
    </AdminDataSheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]/70">{label}</dt>
      <dd className="mt-0.5 text-[var(--navy)]">{value}</dd>
    </div>
  );
}
