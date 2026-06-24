"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { EquipmentSelect } from "@/components/admin/EquipmentSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { StockItemSelect } from "@/components/admin/StockItemSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { PartsUsage, StockItem } from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { PartsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

const USAGE_TYPE_LABELS: Record<PartsUsage["usageType"], string> = {
  part: "Pièce",
  lubricant: "Lubrifiant",
};

export function PartsManager() {
  const toast = useAdminToast();
  const [tab, setTab] = useState("detail");
  const [rows, setRows] = useState<PartsUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const { equipment, projects, refresh: refreshRef } = useOpsReferential();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [projectId, setProjectId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [stockItemId, setStockItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [usageType, setUsageType] = useState<"part" | "lubricant">("part");
  const [usageDate, setUsageDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      fetch("/api/admin/parts-usage", { cache: "no-store" }),
      fetch("/api/admin/stock/items", { cache: "no-store" }),
    ]);
    if (pRes.ok) setRows((await pRes.json()) as PartsUsage[]);
    if (sRes.ok) setStock((await sRes.json()) as StockItem[]);
    await refreshRef();
    setLoading(false);
  }, [refreshRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const byEquipment = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = r.equipmentName || "—";
      map.set(k, (map.get(k) ?? 0) + r.qty * r.unitPrice);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const totalMad = rows.reduce((a, r) => a + r.qty * r.unitPrice, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.equipmentName.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function submit() {
    if (!equipmentId) {
      toast.error("Sélectionnez un engin.");
      return;
    }
    if (qty <= 0) {
      toast.error("Indiquez une quantité.");
      return;
    }
    setSaving(true);
    const eq = equipment.find((e) => e.id === equipmentId);
    const item = stock.find((s) => s.id === stockItemId);
    const res = await fetch("/api/admin/parts-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: projectId || undefined,
        equipmentId,
        equipmentName: eq?.name || "",
        stockItemId: item?.id || null,
        reference: item?.reference || "",
        designation: item?.designation || "",
        usageType,
        qty,
        unitPrice: item?.unitPrice ?? 0,
        usageDate,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Consommation enregistrée.");
    await load();
    setTab("detail");
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Pièces & lubrifiants"
        description="Consommation par engin liée au stock."
        exportHref="/api/admin/parts-usage?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={() => setTab("new")}>
            Saisir consommation
          </button>
        }
      />

      <ReferentialBanner
        sitesCount={projects.length}
        equipmentCount={equipment.length}
        requireSites
        requireEquipment
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Valeur consommée", value: `${totalMad.toLocaleString("fr-MA")} MAD` },
            { label: "Lignes", value: String(rows.length) },
            { label: "Articles stock", value: String(stock.length) },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "detail", label: "Détail", badge: rows.length || undefined },
          { id: "byEq", label: "Par engin" },
          { id: "new", label: "Saisir" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <PartsPageSkeleton partial /> : null}

      {!loading && tab === "byEq" ? (
        <div className="space-y-2">
          {byEquipment.length === 0 ? (
            <p className="text-sm text-[var(--graphite)]/70">Aucune consommation enregistrée.</p>
          ) : (
            byEquipment.map(([name, total]) => (
              <div key={name} className="flex justify-between rounded-md border border-border bg-white px-4 py-2.5 text-sm">
                <span className="font-medium text-[var(--navy)]">{name}</span>
                <span>{total.toLocaleString("fr-MA")} MAD</span>
              </div>
            ))
          )}
        </div>
      ) : null}

      {!loading && tab === "detail" ? (
        <AdminInventoryCard
          title="Liste des consommations"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Engin, référence…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucune consommation enregistrée."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setTab("new")}>
                Saisir consommation
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Engin</th>
                  <th className={thClass}>Réf.</th>
                  <th className={thClass}>Désignation</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Qté</th>
                  <th className={thClass}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.usageDate}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.equipmentName} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.reference} lines={1} />
                    </td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={r.designation} />
                    </td>
                    <td className={tdClass}>{USAGE_TYPE_LABELS[r.usageType] ?? r.usageType}</td>
                    <td className={tdClass}>{r.qty}</td>
                    <td className={`${tdClass} tabular-nums`}>
                      {(r.qty * r.unitPrice).toLocaleString("fr-MA")} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {!loading && tab === "new" ? (
        <AdminFormCard
          title="Consommation"
          hint={stock.length === 0 ? "Aucun article en stock — complétez d'abord le module Stock." : undefined}
          footer={
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          }
        >
          <div className="max-w-md space-y-2">
            <input type="date" className={inputClass} value={usageDate} onChange={(e) => setUsageDate(e.target.value)} />
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
            <EquipmentSelect equipment={equipment} value={equipmentId} onChange={setEquipmentId} />
            <StockItemSelect
              items={stock}
              value={stockItemId}
              onChange={setStockItemId}
              placeholder="Article stock (optionnel)"
              showStock
              inputClassName={inputClass}
            />
            <SearchableEnumSelect
              options={{ part: "Pièce", lubricant: "Lubrifiant" }}
              value={usageType}
              onChange={(v) => setUsageType(v as "part" | "lubricant")}
              allowEmpty={false}
              inputClassName={inputClass}
            />
            <input type="number" className={inputClass} placeholder="Qté *" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
          </div>
        </AdminFormCard>
      ) : null}

      {stock.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--graphite)]/70">
          <Link href="/admin/stock" className="underline text-[var(--navy)]">
            Ouvrir le stock →
          </Link>
        </p>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
