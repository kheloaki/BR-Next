"use client";

import Link from "next/link";
import type { ProjectSummary } from "@/components/admin/operations-types";
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
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import {
  isProjectFicheSectionVisible,
  type ProjectFicheSectionId,
} from "@/lib/admin/project-fiche-sections";
import { formatMoney } from "@/lib/admin/price-ht-ttc";
import type { AdminProject } from "@/components/admin/operations-types";

function fmtDate(d: string) {
  const x = d.slice(0, 10);
  if (!x) return "—";
  const [y, m, day] = x.split("-");
  return `${day}/${m}/${y}`;
}

function ModuleLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={btnSecondarySm}>
      {label}
    </Link>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <p className="px-5 py-6 text-center text-sm text-[var(--graphite)]/70">{message}</p>;
}

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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Engin</th>
                  <th className={thClass}>Litres</th>
                  {canSeeFinancials ? <th className={thClass}>Montant</th> : null}
                  <th className={thClass}>N° bon</th>
                </tr>
              </thead>
              <tbody>
                {summary.fuel.recent.map((f) => (
                  <tr key={f.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(f.entryDate)}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={f.equipmentName || f.vehicleLabel} lines={1} />
                    </td>
                    <td className={tdClass}>{f.litres.toLocaleString("fr-MA")} L</td>
                    {canSeeFinancials ? (
                      <td className={tdClass}>
                        {f.totalAmount != null ? `${formatMoney(f.totalAmount)} MAD` : "—"}
                      </td>
                    ) : null}
                    <td className={tdClass}>
                      <AdminTruncatedText text={f.ticketNo} lines={1} />
                    </td>
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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Matériel</th>
                  <th className={thClass}>Réf.</th>
                  {canSeeFinancials ? <th className={thClass}>Montant</th> : null}
                  <th className={thClass}>N° bon</th>
                </tr>
              </thead>
              <tbody>
                {summary.rentals.recent.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.lineDate ? fmtDate(r.lineDate) : "—"}</td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={r.designation || r.equipmentName} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.reference || r.matricule} lines={1} />
                    </td>
                    {canSeeFinancials ? (
                      <td className={tdClass}>{formatMoney(r.totalMad)} MAD</td>
                    ) : null}
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.bonLocationNo || r.contractNo} lines={1} />
                    </td>
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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Site</th>
                  <th className={thClass}>Tonnage</th>
                  <th className={thClass}>Objectif</th>
                </tr>
              </thead>
              <tbody>
                {summary.production.recent.map((p) => (
                  <tr key={p.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(p.entryDate)}</td>
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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Foreuse</th>
                  <th className={thClass}>Mètres</th>
                  <th className={thClass}>Opérateur</th>
                </tr>
              </thead>
              <tbody>
                {summary.drilling.recent.map((d) => (
                  <tr key={d.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(d.reportDate)}</td>
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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Véhicule</th>
                  <th className={thClass}>Trajet</th>
                  <th className={thClass}>Km</th>
                </tr>
              </thead>
              <tbody>
                {summary.trips.recent.map((t) => (
                  <tr key={t.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(t.tripDate)}</td>
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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Employé</th>
                  <th className={thClass}>Statut</th>
                  <th className={thClass}>Heures sup.</th>
                </tr>
              </thead>
              <tbody>
                {summary.attendance.recent.map((a) => (
                  <tr key={a.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(a.recordDate)}</td>
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
                  <th className={thClass}>N°</th>
                  <th className={thClass}>Catégorie</th>
                  <th className={thClass}>Objet</th>
                  <th className={thClass}>Statut</th>
                  {canSeeFinancials ? <th className={thClass}>Montant</th> : null}
                </tr>
              </thead>
              <tbody>
                {summary.purchaseRequests.recent.map((da) => (
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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Article</th>
                  <th className={thClass}>Qté</th>
                  {canSeeFinancials ? <th className={thClass}>Total HT</th> : null}
                </tr>
              </thead>
              <tbody>
                {summary.stock.recent.map((m) => (
                  <tr key={m.id} className={rowHover}>
                    <td className={tdClass}>{fmtDate(m.movementDate)}</td>
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
