"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import type { AdminProject } from "@/components/admin/operations-types";
import { btnSecondary, inputClass, moduleWrap } from "@/components/admin/admin-form-styles";
import { GlobalEtatsPanelSkeleton } from "@/components/admin/skeletons/pages";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { ProjectReportExportButtons } from "@/components/admin/ProjectReportExportButtons";
import { SituationEnginSelect } from "@/components/admin/SituationEnginSelect";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import type { ProjectReportModule } from "@/lib/admin/project-report-types";

const MODULES: ProjectReportModule[] = [
  "global",
  "gasoil",
  "stock",
  "rentals",
  "situation_engins",
  "personnel",
  "purchases",
  "facturation",
  "profitability",
];

export function GlobalEtatsPanel() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [module, setModule] = useState<ProjectReportModule>("global");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [canExport, setCanExport] = useState(true);
  const [canFinancial, setCanFinancial] = useState(false);
  const [exportError, setExportError] = useState("");
  const [enginMaterialId, setEnginMaterialId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [projRes, ctxRes] = await Promise.all([
      fetch("/api/admin/projects", { cache: "no-store" }),
      fetch("/api/admin/organization/context", { cache: "no-store" }),
    ]);
    if (projRes.ok) {
      const rows = (await projRes.json()) as AdminProject[];
      setProjects(rows);
      if (!projectId && rows[0]) setProjectId(rows[0].id);
    }
    if (ctxRes.ok) {
      const ctx = (await ctxRes.json()) as {
        canExportReports?: boolean;
        canSeeFinancialTotals?: boolean;
      };
      setCanExport(ctx.canExportReports ?? true);
      setCanFinancial(ctx.canSeeFinancialTotals ?? false);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setEnginMaterialId("");
  }, [projectId, module]);

  const moduleOptions = useMemo(
    () => Object.fromEntries(MODULES.map((m) => [m, REPORT_MODULE_LABELS[m]])) as Record<string, string>,
    [],
  );

  if (loading) return <GlobalEtatsPanelSkeleton />;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="États ERP"
        description="Générez les états Sage par chantier, période et module."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-[var(--graphite)]/75">Projet</span>
          <ProjectSelect
            projects={projects}
            value={projectId}
            onChange={setProjectId}
            placeholder="Sélectionner…"
            activeOnly={false}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--graphite)]/75">Du</span>
          <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--graphite)]/75">Au</span>
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-[var(--graphite)]/75">Module</span>
          <SearchableEnumSelect
            options={moduleOptions}
            value={module}
            onChange={(v) => setModule(v as ProjectReportModule)}
            inputClassName={inputClass}
            allowEmpty={false}
          />
        </label>
        {module === "situation_engins" ? (
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-[var(--graphite)]/75">Engin (optionnel)</span>
            <SituationEnginSelect
              projectId={projectId}
              value={enginMaterialId}
              onChange={setEnginMaterialId}
            />
          </label>
        ) : null}
      </div>

      <ProjectReportExportButtons
        projectId={projectId}
        module={module}
        from={from}
        to={to}
        materialId={enginMaterialId}
        canExport={canExport}
        canFinancial={canFinancial}
        onError={setExportError}
      />
      {exportError ? <p className="text-sm text-red-700 mb-4">{exportError}</p> : null}

      {projectId ? (
        <Link href={`/admin/projets/${projectId}`} className={`${btnSecondary} mb-4 inline-block`}>
          Fiche projet →
        </Link>
      ) : null}

      <p className="text-sm text-[var(--graphite)]/75">
        Sélectionnez un chantier et un module pour exporter. Les états incluent uniquement les écritures rattachées au
        projet sur la période choisie.
      </p>
    </div>
  );
}
