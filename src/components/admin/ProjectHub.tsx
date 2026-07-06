"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { AdminBackLink } from "@/components/admin/ux/AdminBackLink";
import { AdminLink } from "@/components/admin/ux/AdminLink";
import {
  PROJECT_STATUS_LABELS,
  type ProjectSummary,
} from "@/components/admin/operations-types";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ProjectFicheDashboard } from "@/components/admin/ProjectFicheDashboard";
import { ProjectFinancePanel } from "@/components/admin/ProjectFinancePanel";
import { ProjectReportsPanel } from "@/components/admin/ProjectReportsPanel";
import { ProjectDocumentsPanel, ProjectHistoryPanel } from "@/components/admin/ProjectDocumentsPanel";
import { ProjectFicheSettingsSheet } from "@/components/admin/ProjectFicheSettingsSheet";
import { btnSecondary, moduleWrap } from "@/components/admin/admin-form-styles";
import { formatDateFr } from "@/lib/admin/date-time-fr";
import { ProjectHubSkeleton } from "@/components/admin/skeletons/pages";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";

export function ProjectHub({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canManageFinance, setCanManageFinance] = useState(false);
  const [canSeeFinancials, setCanSeeFinancials] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<
    "overview" | "etats" | "finance" | "rentabilite" | "documents" | "historique"
  >("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [summaryRes, ctxRes] = await Promise.all([
      fetch(`/api/admin/projects/${projectId}/summary`, { cache: "no-store" }),
      fetch("/api/admin/organization/context", { cache: "no-store" }),
    ]);
    if (ctxRes.ok) {
      const ctx = (await ctxRes.json()) as {
        canManageFinance?: boolean;
        canAccessFinance?: boolean;
        canSeeFinancialTotals?: boolean;
      };
      setCanManageFinance(Boolean(ctx.canAccessFinance));
      setCanSeeFinancials(ctx.canSeeFinancialTotals ?? true);
    }
    if (!summaryRes.ok) {
      setError(summaryRes.status === 404 ? "Projet introuvable." : "Impossible de charger la fiche.");
      setSummary(null);
    } else {
      setSummary((await summaryRes.json()) as ProjectSummary);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ProjectHubSkeleton />;

  if (error || !summary) {
    return (
      <div className={moduleWrap}>
        <p className="text-sm text-red-700">{error || "Erreur"}</p>
        <AdminBackLink
          fallback="/admin/projets"
          label="← Retour aux projets"
          showIcon={false}
          className="mt-3 inline-block text-sm underline text-[var(--navy)]"
        />
      </div>
    );
  }

  const { project } = summary;

  return (
    <div className={moduleWrap}>
      <div className="mb-2">
        <AdminBackLink
          fallback="/admin/projets"
          label="← Projets"
          showIcon={false}
          className="text-xs text-[var(--graphite)]/70 hover:text-[var(--navy)]"
        />
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
        exportHref={`/api/admin/projects/${projectId}/summary`}
        actions={
          <>
            <button
              type="button"
              className={`${btnSecondary} inline-flex items-center gap-2`}
              title="Paramètres du projet"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" aria-hidden />
              Paramètres
            </button>
            <AdminLink href="/admin/projets" className={btnSecondary}>
              Liste projets
            </AdminLink>
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
              Période : {project.startDate ? formatDateFr(project.startDate) : "—"} → {project.endDate ? formatDateFr(project.endDate) : "—"}
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
        <ProjectFicheDashboard
          projectId={projectId}
          projectName={project.name}
          project={project}
          summary={summary}
          canManageFinance={canManageFinance}
          canSeeFinancials={canSeeFinancials}
        />
      )}

      <ProjectFicheSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        project={project}
        onSaved={(updated) => {
          setSummary((prev) => (prev ? { ...prev, project: updated } : prev));
        }}
      />
    </div>
  );
}
