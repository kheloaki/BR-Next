"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminLink } from "@/components/admin/ux/AdminLink";
import type {
  AttendanceRecord,
  DrillingReport,
  FuelEntry,
  ProductionEntry,
  ProjectSummary,
  PurchaseRequest,
  RentalContract,
  StockMovement,
  Trip,
} from "@/components/admin/operations-types";
import {
  PURCHASE_CATEGORY_LABELS,
  PURCHASE_STATUS_LABELS,
} from "@/components/admin/operations-types";
import {
  btnSecondarySm,
  inventoryPanelTitle,
  rowHover,
  tdClass,
  tdTextClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import {
  isProjectFicheSectionVisible,
  type ProjectFicheSectionId,
} from "@/lib/admin/project-fiche-sections";
import { formatMoney } from "@/lib/admin/price-ht-ttc";
import type { AdminProject } from "@/components/admin/operations-types";
import { formatDateFr } from "@/lib/admin/date-time-fr";

function ModuleLink({ href, label }: { href: string; label: string }) {
  return (
    <AdminLink href={href} className={btnSecondarySm}>
      {label}
    </AdminLink>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <p className="px-5 py-6 text-center text-sm text-[var(--graphite)]/70">{message}</p>;
}

const fuelSortAccessors = {
  date: (f: FuelEntry) => f.entryDate,
  equipment: (f: FuelEntry) => f.equipmentName || f.vehicleLabel,
  litres: (f: FuelEntry) => f.litres,
  amount: (f: FuelEntry) => f.totalAmount ?? 0,
  ticketNo: (f: FuelEntry) => f.ticketNo,
};

const rentalSortAccessors = {
  date: (r: RentalContract) => r.lineDate ?? "",
  material: (r: RentalContract) => r.designation || r.equipmentName,
  reference: (r: RentalContract) => r.reference || r.matricule,
  amount: (r: RentalContract) => r.totalMad,
  bonNo: (r: RentalContract) => r.bonLocationNo || r.contractNo,
};

const productionSortAccessors = {
  date: (p: ProductionEntry) => p.entryDate,
  site: (p: ProductionEntry) => p.siteName,
  tonnage: (p: ProductionEntry) => p.tonnage,
  target: (p: ProductionEntry) => p.targetTonnage,
};

const drillingSortAccessors = {
  date: (d: DrillingReport) => d.reportDate,
  rig: (d: DrillingReport) => d.rigName,
  meters: (d: DrillingReport) => d.metersDrilled,
  operator: (d: DrillingReport) => d.operatorName,
};

const tripSortAccessors = {
  date: (t: Trip) => t.tripDate,
  vehicle: (t: Trip) => t.plate || t.vehicleCode,
  route: (t: Trip) => `${t.departure} → ${t.destination}`,
  km: (t: Trip) => t.distanceKm,
};

const attendanceSortAccessors = {
  date: (a: AttendanceRecord) => a.recordDate,
  employee: (a: AttendanceRecord) => a.employeeName,
  status: (a: AttendanceRecord) => a.status,
  overtime: (a: AttendanceRecord) => a.overtimeHours,
};

const purchaseSortAccessors = {
  number: (da: PurchaseRequest) => da.number,
  category: (da: PurchaseRequest) => PURCHASE_CATEGORY_LABELS[da.category],
  subject: (da: PurchaseRequest) => da.subject || da.designation,
  status: (da: PurchaseRequest) => PURCHASE_STATUS_LABELS[da.status],
  amount: (da: PurchaseRequest) => da.totalAmount,
};

const stockSortAccessors = {
  date: (m: StockMovement) => m.movementDate,
  type: (m: StockMovement) => m.movementType,
  article: (m: StockMovement) => m.designation || m.reference,
  qty: (m: StockMovement) => m.qty,
  totalHt: (m: StockMovement) => m.totalPriceHt,
};

export function ProjectFicheActivityOverview({
  summary,
  project,
  canSeeFinancials,
}: {
  summary: ProjectSummary;
  project: AdminProject;
  canSeeFinancials: boolean;
}) {
  const vis = (id: ProjectFicheSectionId) => isProjectFicheSectionVisible(project, id);

  const fuelSort = useTableSort("date", "desc");
  const rentalsSort = useTableSort("date", "desc");
  const productionSort = useTableSort("date", "desc");
  const drillingSort = useTableSort("date", "desc");
  const tripsSort = useTableSort("date", "desc");
  const attendanceSort = useTableSort("date", "desc");
  const purchasesSort = useTableSort("number", "desc");
  const stockSort = useTableSort("date", "desc");

  const sortedFuel = useMemo(
    () => fuelSort.applySort(summary.fuel.recent, fuelSortAccessors),
    [fuelSort.applySort, summary.fuel.recent],
  );
  const sortedRentals = useMemo(
    () => rentalsSort.applySort(summary.rentals.recent, rentalSortAccessors),
    [rentalsSort.applySort, summary.rentals.recent],
  );
  const sortedProduction = useMemo(
    () => productionSort.applySort(summary.production.recent, productionSortAccessors),
    [productionSort.applySort, summary.production.recent],
  );
  const sortedDrilling = useMemo(
    () => drillingSort.applySort(summary.drilling.recent, drillingSortAccessors),
    [drillingSort.applySort, summary.drilling.recent],
  );
  const sortedTrips = useMemo(
    () => tripsSort.applySort(summary.trips.recent, tripSortAccessors),
    [tripsSort.applySort, summary.trips.recent],
  );
  const sortedAttendance = useMemo(
    () => attendanceSort.applySort(summary.attendance.recent, attendanceSortAccessors),
    [attendanceSort.applySort, summary.attendance.recent],
  );
  const sortedPurchases = useMemo(
    () => purchasesSort.applySort(summary.purchaseRequests.recent, purchaseSortAccessors),
    [purchasesSort.applySort, summary.purchaseRequests.recent],
  );
  const sortedStock = useMemo(
    () => stockSort.applySort(summary.stock.recent, stockSortAccessors),
    [stockSort.applySort, summary.stock.recent],
  );

  const kpiItems = [
    vis("gasoil")
      ? { label: "Gasoil (L)", value: summary.fuel.totalLitres.toLocaleString("fr-MA") }
      : null,
    vis("rentals")
      ? {
          label: "Location (MAD)",
          value: canSeeFinancials ? formatMoney(summary.rentals.totalMad) : "—",
        }
      : null,
    vis("production")
      ? { label: "Production (t)", value: summary.production.totalTonnage.toLocaleString("fr-MA") }
      : null,
    vis("drilling")
      ? { label: "Forage (m)", value: summary.drilling.totalMeters.toLocaleString("fr-MA") }
      : null,
    vis("logistics")
      ? { label: "Transport (km)", value: summary.trips.totalKm.toLocaleString("fr-MA") }
      : null,
    vis("personnel")
      ? { label: "Présences", value: String(summary.attendance.presentCount) }
      : null,
    vis("purchases")
      ? {
          label: "DA (MAD)",
          value: canSeeFinancials ? formatMoney(summary.purchaseRequests.totalAmount) : "—",
        }
      : null,
    vis("stock")
      ? { label: "Mouv. stock", value: String(summary.stock.movementCount) }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (kpiItems.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`${inventoryPanelTitle} mb-3`}>Activité chantier — vue globale</h3>
        <AdminMiniStats items={kpiItems} />
      </div>

      {vis("gasoil") ? (
        <AdminInventoryCard
          title={`Carburant / gasoil (${summary.fuel.entryCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/fuel/journal" label="Module carburant" />}
        >
          {summary.fuel.recent.length === 0 ? (
            <EmptyRow message="Aucune sortie gasoil enregistrée pour ce chantier." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="N° bon" sortKey="ticketNo" sort={fuelSort.sort} onSort={fuelSort.onSort} />
                  <AdminSortableTh label="Date" sortKey="date" sort={fuelSort.sort} onSort={fuelSort.onSort} />
                  <AdminSortableTh label="Engin" sortKey="equipment" sort={fuelSort.sort} onSort={fuelSort.onSort} />
                  <AdminSortableTh label="Litres" sortKey="litres" sort={fuelSort.sort} onSort={fuelSort.onSort} align="right" />
                  {canSeeFinancials ? (
                    <AdminSortableTh label="Montant" sortKey="amount" sort={fuelSort.sort} onSort={fuelSort.onSort} align="right" />
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sortedFuel.map((f) => (
                  <tr key={f.id} className={rowHover}>
                    <td className={tdClass}>
                      <AdminTruncatedText text={f.ticketNo} lines={1} />
                    </td>
                    <td className={tdClass}>{formatDateFr(f.entryDate)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={f.equipmentName || f.vehicleLabel} lines={1} />
                    </td>
                    <td className={tdClass}>{f.litres.toLocaleString("fr-MA")} L</td>
                    {canSeeFinancials ? (
                      <td className={tdClass}>
                        {f.totalAmount != null ? `${formatMoney(f.totalAmount)} MAD` : "—"}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {vis("rentals") ? (
        <AdminInventoryCard
          title={`Location matériel (${summary.rentals.entryCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/equipment-rental" label="Module location" />}
        >
          {summary.rentals.recent.length === 0 ? (
            <EmptyRow message="Aucun bon de location pour ce chantier." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="N° bon" sortKey="bonNo" sort={rentalsSort.sort} onSort={rentalsSort.onSort} />
                  <AdminSortableTh label="Date" sortKey="date" sort={rentalsSort.sort} onSort={rentalsSort.onSort} />
                  <AdminSortableTh label="Matériel" sortKey="material" sort={rentalsSort.sort} onSort={rentalsSort.onSort} />
                  <AdminSortableTh label="Réf." sortKey="reference" sort={rentalsSort.sort} onSort={rentalsSort.onSort} />
                  {canSeeFinancials ? (
                    <AdminSortableTh label="Montant" sortKey="amount" sort={rentalsSort.sort} onSort={rentalsSort.onSort} align="right" />
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sortedRentals.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.bonLocationNo || r.contractNo} lines={1} />
                    </td>
                    <td className={tdClass}>{r.lineDate ? formatDateFr(r.lineDate) : "—"}</td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={r.designation || r.equipmentName} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.reference || r.matricule} lines={1} />
                    </td>
                    {canSeeFinancials ? (
                      <td className={tdClass}>{formatMoney(r.totalMad)} MAD</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {vis("production") ? (
        <AdminInventoryCard
          title={`Production (${summary.production.entryCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/production" label="Module production" />}
        >
          {summary.production.recent.length === 0 ? (
            <EmptyRow message="Aucune saisie production." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Date" sortKey="date" sort={productionSort.sort} onSort={productionSort.onSort} />
                  <AdminSortableTh label="Site" sortKey="site" sort={productionSort.sort} onSort={productionSort.onSort} />
                  <AdminSortableTh label="Tonnage" sortKey="tonnage" sort={productionSort.sort} onSort={productionSort.onSort} align="right" />
                  <AdminSortableTh label="Objectif" sortKey="target" sort={productionSort.sort} onSort={productionSort.onSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedProduction.map((p) => (
                  <tr key={p.id} className={rowHover}>
                    <td className={tdClass}>{formatDateFr(p.entryDate)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={p.siteName} lines={1} />
                    </td>
                    <td className={tdClass}>{p.tonnage.toLocaleString("fr-MA")} t</td>
                    <td className={tdClass}>{p.targetTonnage.toLocaleString("fr-MA")} t</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {vis("drilling") ? (
        <AdminInventoryCard
          title={`Forage (${summary.drilling.entryCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/drilling" label="Module forage" />}
        >
          {summary.drilling.recent.length === 0 ? (
            <EmptyRow message="Aucun rapport de forage." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Date" sortKey="date" sort={drillingSort.sort} onSort={drillingSort.onSort} />
                  <AdminSortableTh label="Foreuse" sortKey="rig" sort={drillingSort.sort} onSort={drillingSort.onSort} />
                  <AdminSortableTh label="Mètres" sortKey="meters" sort={drillingSort.sort} onSort={drillingSort.onSort} align="right" />
                  <AdminSortableTh label="Opérateur" sortKey="operator" sort={drillingSort.sort} onSort={drillingSort.onSort} />
                </tr>
              </thead>
              <tbody>
                {sortedDrilling.map((d) => (
                  <tr key={d.id} className={rowHover}>
                    <td className={tdClass}>{formatDateFr(d.reportDate)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={d.rigName} lines={1} />
                    </td>
                    <td className={tdClass}>{d.metersDrilled.toLocaleString("fr-MA")} m</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={d.operatorName} lines={1} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {vis("logistics") ? (
        <AdminInventoryCard
          title={`Logistique / transport (${summary.trips.entryCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/logistics" label="Module logistique" />}
        >
          {summary.trips.recent.length === 0 ? (
            <EmptyRow message="Aucun trajet enregistré." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Date" sortKey="date" sort={tripsSort.sort} onSort={tripsSort.onSort} />
                  <AdminSortableTh label="Véhicule" sortKey="vehicle" sort={tripsSort.sort} onSort={tripsSort.onSort} />
                  <AdminSortableTh label="Trajet" sortKey="route" sort={tripsSort.sort} onSort={tripsSort.onSort} />
                  <AdminSortableTh label="Km" sortKey="km" sort={tripsSort.sort} onSort={tripsSort.onSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedTrips.map((t) => (
                  <tr key={t.id} className={rowHover}>
                    <td className={tdClass}>{formatDateFr(t.tripDate)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={t.plate || t.vehicleCode} lines={1} />
                    </td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={`${t.departure} → ${t.destination}`} />
                    </td>
                    <td className={tdClass}>{t.distanceKm.toLocaleString("fr-MA")}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {vis("personnel") ? (
        <AdminInventoryCard
          title={`Personnel / pointage (${summary.attendance.entryCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/hr" label="Module RH" />}
        >
          {summary.attendance.recent.length === 0 ? (
            <EmptyRow message="Aucun pointage pour ce chantier." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Date" sortKey="date" sort={attendanceSort.sort} onSort={attendanceSort.onSort} />
                  <AdminSortableTh label="Employé" sortKey="employee" sort={attendanceSort.sort} onSort={attendanceSort.onSort} />
                  <AdminSortableTh label="Statut" sortKey="status" sort={attendanceSort.sort} onSort={attendanceSort.onSort} />
                  <AdminSortableTh label="Heures sup." sortKey="overtime" sort={attendanceSort.sort} onSort={attendanceSort.onSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedAttendance.map((a) => (
                  <tr key={a.id} className={rowHover}>
                    <td className={tdClass}>{formatDateFr(a.recordDate)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={a.employeeName} lines={1} />
                    </td>
                    <td className={tdClass}>{a.status}</td>
                    <td className={tdClass}>{a.overtimeHours || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {vis("purchases") ? (
        <AdminInventoryCard
          title={`Demandes d'achat (${summary.purchaseRequests.entryCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/purchase-requests" label="Module DA" />}
        >
          {summary.purchaseRequests.recent.length === 0 ? (
            <EmptyRow message="Aucune demande d'achat." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="N°" sortKey="number" sort={purchasesSort.sort} onSort={purchasesSort.onSort} />
                  <AdminSortableTh label="Catégorie" sortKey="category" sort={purchasesSort.sort} onSort={purchasesSort.onSort} />
                  <AdminSortableTh label="Objet" sortKey="subject" sort={purchasesSort.sort} onSort={purchasesSort.onSort} />
                  <AdminSortableTh label="Statut" sortKey="status" sort={purchasesSort.sort} onSort={purchasesSort.onSort} />
                  {canSeeFinancials ? (
                    <AdminSortableTh label="Montant" sortKey="amount" sort={purchasesSort.sort} onSort={purchasesSort.onSort} align="right" />
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sortedPurchases.map((da) => (
                  <tr key={da.id} className={rowHover}>
                    <td className={tdClass}>{da.number || "—"}</td>
                    <td className={tdClass}>{PURCHASE_CATEGORY_LABELS[da.category]}</td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={da.subject || da.designation} />
                    </td>
                    <td className={tdClass}>{PURCHASE_STATUS_LABELS[da.status]}</td>
                    {canSeeFinancials ? (
                      <td className={tdClass}>{formatMoney(da.totalAmount)} MAD</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {vis("stock") ? (
        <AdminInventoryCard
          title={`Mouvements stock (${summary.stock.movementCount})`}
          titleClassName={inventoryPanelTitle}
          actions={<ModuleLink href="/admin/stock" label="Module stock" />}
        >
          {summary.stock.recent.length === 0 ? (
            <EmptyRow message="Aucun mouvement stock lié à ce chantier." />
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Date" sortKey="date" sort={stockSort.sort} onSort={stockSort.onSort} />
                  <AdminSortableTh label="Type" sortKey="type" sort={stockSort.sort} onSort={stockSort.onSort} />
                  <AdminSortableTh label="Article" sortKey="article" sort={stockSort.sort} onSort={stockSort.onSort} />
                  <AdminSortableTh label="Qté" sortKey="qty" sort={stockSort.sort} onSort={stockSort.onSort} align="right" />
                  {canSeeFinancials ? (
                    <AdminSortableTh label="Total HT" sortKey="totalHt" sort={stockSort.sort} onSort={stockSort.onSort} align="right" />
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sortedStock.map((m) => (
                  <tr key={m.id} className={rowHover}>
                    <td className={tdClass}>{formatDateFr(m.movementDate)}</td>
                    <td className={tdClass}>{m.movementType}</td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={m.designation || m.reference} />
                    </td>
                    <td className={tdClass}>
                      {m.qty} {m.unit}
                    </td>
                    {canSeeFinancials ? (
                      <td className={tdClass}>{formatMoney(m.totalPriceHt)} MAD</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}
    </div>
  );
}
