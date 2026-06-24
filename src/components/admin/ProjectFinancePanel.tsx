"use client";

import { useEffect, useState } from "react";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { ProjectFinancePanelSkeleton } from "@/components/admin/skeletons/pages";

type ProjectFinanceReport = {
  revenue: {
    actualRevenueHt: number;
    actualRevenueTtc: number;
    paidRevenue: number;
    unpaidClient: number;
  };
  costs: {
    committedCostsHt: number;
    paidCosts: number;
    unpaidSupplier: number;
    projectExpenses: number;
  };
  profitability: {
    marginHt: number;
    cashMargin: number;
    unpaidExposure: number;
  };
  cashflow: { encaissements: number; decaissements: number };
};

export function ProjectFinancePanel({ projectId }: { projectId: string }) {
  const [report, setReport] = useState<ProjectFinanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}/reports/finance`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setReport({
          revenue: data.revenue,
          costs: data.costs,
          profitability: data.profitability,
          cashflow: data.cashflow,
        });
      }
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) return <ProjectFinancePanelSkeleton />;

  if (!report) {
    return <p className="text-sm text-[var(--graphite)]/70">Données finance indisponibles.</p>;
  }

  const fmt = (n: number) => `${n.toLocaleString("fr-MA")} MAD`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--graphite)]/75">
        Finance (cash) — séparé de la rentabilité opérations. Les montants proviennent des mouvements et documents
        enregistrés en gestion finance.
      </p>

      <AdminMiniStats
        items={[
          { label: "Recettes TTC", value: fmt(report.revenue.actualRevenueTtc) },
          { label: "Encaissé", value: fmt(report.revenue.paidRevenue) },
          { label: "Impayé client", value: fmt(report.revenue.unpaidClient) },
          { label: "Marge HT", value: fmt(report.profitability.marginHt) },
          { label: "Marge cash", value: fmt(report.profitability.cashMargin) },
          { label: "Dépenses chantier", value: fmt(report.costs.projectExpenses) },
        ]}
      />

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-md border border-border p-4">
          <p className="font-medium text-[var(--navy)] mb-2">Recettes</p>
          <ul className="space-y-1 text-[var(--graphite)]/80">
            <li>Facturé HT : {fmt(report.revenue.actualRevenueHt)}</li>
            <li>Encaissé : {fmt(report.revenue.paidRevenue)}</li>
            <li>Encaissements période : {fmt(report.cashflow.encaissements)}</li>
          </ul>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="font-medium text-[var(--navy)] mb-2">Coûts & trésorerie</p>
          <ul className="space-y-1 text-[var(--graphite)]/80">
            <li>Engagé HT : {fmt(report.costs.committedCostsHt)}</li>
            <li>Payé fournisseurs : {fmt(report.costs.paidCosts)}</li>
            <li>Décaissements période : {fmt(report.cashflow.decaissements)}</li>
            <li>Exposition nette : {fmt(report.profitability.unpaidExposure)}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
