"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PROJECT_STATUS_LABELS,
  type ProjectSummary,
} from "@/components/admin/operations-types";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ProjectFinancePanel } from "@/components/admin/ProjectFinancePanel";
import { ProjectReportsPanel } from "@/components/admin/ProjectReportsPanel";
import { ProjectDocumentsPanel, ProjectHistoryPanel } from "@/components/admin/ProjectDocumentsPanel";
import { btnSecondary, moduleWrap, tdClass, thClass } from "@/components/admin/admin-form-styles";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";

const MODULE_LINKS = [
  { href: "fuel", label: "Carburant", path: "/admin/fuel/stock" },
  { href: "hr", label: "RH & pointage", path: "/admin/hr" },
  { href: "stock", label: "Stock", path: "/admin/stock" },
  { href: "purchase-requests", label: "Demandes d'achat", path: "/admin/purchase-requests" },
  { href: "equipment-rental", label: "Matériel", path: "/admin/equipment-rental/materials" },
  { href: "rental-bons", label: "Bons location", path: "/admin/equipment-rental/bons" },
  { href: "traitements-achat", label: "Traitement achat", path: "/admin/traitements-achat" },
  { href: "traitements-vente", label: "Traitement vente", path: "/admin/traitements-vente" },
] as const;

export function ProjectHub({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<
    "overview" | "etats" | "finance" | "rentabilite" | "documents" | "historique"
  >("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/projects/${projectId}/summary`, { cache: "no-store" });
    if (!res.ok) {
      setError(res.status === 404 ? "Projet introuvable." : "Impossible de charger la fiche.");
      setSummary(null);
    } else {
      setSummary((await res.json()) as ProjectSummary);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <AdminLoading />;

  if (error || !summary) {
    return (
      <div className={moduleWrap}>
        <p className="text-sm text-red-700">{error || "Erreur"}</p>
        <Link href="/admin/projets" className="mt-3 inline-block text-sm underline text-[var(--navy)]">
          ← Retour aux projets
        </Link>
      </div>
    );
  }

  const { project } = summary;
  const q = `project=${projectId}`;

  return (
    <div className={moduleWrap}>
      <div className="mb-2">
        <Link href="/admin/projets" className="text-xs text-[var(--graphite)]/70 hover:text-[var(--navy)]">
          ← Projets
        </Link>
      </div>

      <OpsModuleHeader
        title={project.name}
        description={
          [
            project.code && `Code ${project.code}`,
            project.clientName && `Entreprise : ${project.clientName}`,
            project.marketNumber && `Marché ${project.marketNumber}`,
            project.address || project.location,
            PROJECT_STATUS_LABELS[project.status],
          ]
            .filter(Boolean)
            .join(" · ") || "Fiche projet"
        }
        actions={
          <>
            <Link href={`/admin/projets`} className={btnSecondary}>
              Modifier
            </Link>
          </>
        }
      />

      {(project.managerName ||
        project.address ||
        project.marketDescription ||
        project.chantierDocumentUrl ||
        project.planUrl ||
        project.startDate ||
        project.endDate ||
        project.notes) && (
        <div className="mb-4 rounded-md border border-border bg-[#fafafa] px-4 py-3 text-sm text-[var(--graphite)]/85 space-y-1">
          {project.managerName ? <p>Responsable : {project.managerName}</p> : null}
          {project.address ? <p>Adresse : {project.address}</p> : null}
          {project.marketDescription ? (
            <p className="whitespace-pre-wrap">Description marché : {project.marketDescription}</p>
          ) : null}
          {(project.chantierDocumentUrl || project.planUrl) && (
            <p className="flex flex-wrap gap-3 pt-1">
              {project.chantierDocumentUrl ? (
                <a
                  href={project.chantierDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--navy)] underline underline-offset-2"
                >
                  Document chantier
                </a>
              ) : null}
              {project.planUrl ? (
                <a
                  href={project.planUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--navy)] underline underline-offset-2"
                >
                  Plan
                </a>
              ) : null}
            </p>
          )}
          {project.startDate || project.endDate ? (
            <p>
              Période : {project.startDate ?? "—"} → {project.endDate ?? "—"}
            </p>
          ) : null}
          {project.notes ? <p className="mt-1 text-[var(--graphite)]/70">{project.notes}</p> : null}
        </div>
      )}

      <AdminTabs
        tabs={[
          { id: "overview", label: "Synthèse" },
          { id: "etats", label: "États" },
          { id: "finance", label: "Finance" },
          { id: "rentabilite", label: "Rentabilité" },
          { id: "documents", label: "Documents" },
          { id: "historique", label: "Historique" },
        ]}
        active={tab}
        onChange={(id) =>
          setTab(id as "overview" | "etats" | "finance" | "rentabilite" | "documents" | "historique")
        }
      />

      {tab === "etats" ? (
        <ProjectReportsPanel projectId={projectId} />
      ) : tab === "finance" ? (
        <ProjectFinancePanel projectId={projectId} />
      ) : tab === "rentabilite" ? (
        <ProjectReportsPanel projectId={projectId} defaultModule="profitability" />
      ) : tab === "documents" ? (
        <ProjectDocumentsPanel projectId={projectId} />
      ) : tab === "historique" ? (
        <ProjectHistoryPanel projectId={projectId} />
      ) : (
        <>
      <AdminMiniStats
        items={[
          { label: "Litres carburant", value: `${summary.fuel.totalLitres.toLocaleString("fr-MA")} L` },
          { label: "Présences RH", value: String(summary.attendance.presentCount) },
          { label: "DA en attente", value: String(summary.purchaseRequests.pendingCount) },
          { label: "Location (MAD)", value: summary.rentals.totalMad.toLocaleString("fr-MA") },
          { label: "Mouvements stock", value: String(summary.stock.movementCount) },
        ]}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {MODULE_LINKS.map((m) => (
          <Link
            key={m.href}
            href={`${m.path}?${q}`}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-[var(--navy)] hover:border-[var(--gold)]/50 hover:bg-[#fffbf7]"
          >
            {m.label} →
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section>
          <h3 className="text-sm font-semibold text-[var(--navy)] mb-2">Carburant récent</h3>
          {summary.fuel.recent.length === 0 ? (
            <p className="text-sm text-[var(--graphite)]/70">Aucune saisie.</p>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Engin</th>
                  <th className={thClass}>L</th>
                </tr>
              </thead>
              <tbody>
                {summary.fuel.recent.map((r) => (
                  <tr key={r.id}>
                    <td className={tdClass}>{r.entryDate}</td>
                    <td className={tdClass}>{r.equipmentName}</td>
                    <td className={tdClass}>{r.litres}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[var(--navy)] mb-2">Pointage récent</h3>
          {summary.attendance.recent.length === 0 ? (
            <p className="text-sm text-[var(--graphite)]/70">Aucun pointage.</p>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Nom</th>
                  <th className={thClass}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {summary.attendance.recent.map((r) => (
                  <tr key={r.id}>
                    <td className={tdClass}>{r.recordDate}</td>
                    <td className={tdClass}>{r.employeeName}</td>
                    <td className={tdClass}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </section>
      </div>

      <p className="mt-4 text-xs text-[var(--graphite)]/65">
        Mouvements stock liés : {summary.stock.movementCount} —{" "}
        <Link href={`/admin/stock?${q}`} className="underline text-[var(--navy)]">
          voir le stock
        </Link>
      </p>
        </>
      )}
    </div>
  );
}
