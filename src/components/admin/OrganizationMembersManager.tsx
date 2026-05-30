"use client";

import { useCallback, useEffect, useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

type OrgMember = {
  id: string;
  userId: string | null;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  status: "active" | "invited";
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

export function OrganizationMembersManager() {
  const toast = useAdminToast();
  const [rows, setRows] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [memberRole, setMemberRole] = useState<"member" | "admin">("member");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/organization/members", { cache: "no-store" });
    if (res.ok) {
      setRows((await res.json()) as OrgMember[]);
    } else {
      toast.error(await readApiError(res));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/organization/context", { cache: "no-store" });
      if (res.ok) {
        const ctx = (await res.json()) as { canManageMembers: boolean };
        setCanManage(ctx.canManageMembers);
      }
    })();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/organization/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, memberRole }),
    });
    if (res.ok) {
      toast.success("Invitation enregistrée — l'utilisateur verra les données partagées à la connexion.");
      setEmail("");
      setDisplayName("");
      setMemberRole("member");
      setShowForm(false);
      await load();
    } else {
      toast.error(await readApiError(res));
    }
    setSaving(false);
  }

  async function handleRemove(member: OrgMember) {
    if (!(await confirmDelete(`Retirer ${member.email} de l'équipe ?`))) return;
    const res = await fetch(`/api/admin/organization/members?id=${encodeURIComponent(member.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Membre retiré");
      await load();
    } else {
      toast.error(await readApiError(res));
    }
  }

  return (
    <>
      <OpsModuleHeader
        title="Utilisateurs"
        description="Membres de l'espace BARANE INVEST — tous partagent les mêmes projets, documents et données."
      />

      <div className={`${moduleWrap} mt-4 space-y-4`}>
        <p className="text-sm text-[var(--graphite)]/80">
          Invitez un collègue par e-mail. À la première connexion avec le même compte Clerk, il accèdera
          automatiquement aux données de l&apos;organisation.
        </p>

        {canManage ? (
          <div>
            {!showForm ? (
              <button type="button" className={btnPrimary} onClick={() => setShowForm(true)}>
                + Inviter un utilisateur
              </button>
            ) : (
              <AdminFormCard title="Inviter un utilisateur">
                <form onSubmit={handleInvite} className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-[var(--graphite)]">E-mail *</span>
                    <input
                      type="email"
                      className={inputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="collegue@barane.ma"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--graphite)]">Nom affiché</span>
                    <input
                      className={inputClass}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Optionnel"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--graphite)]">Rôle</span>
                    <select
                      className={inputClass}
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as "member" | "admin")}
                    >
                      <option value="member">Membre</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" className={btnPrimary} disabled={saving}>
                      {saving ? "Envoi…" : "Inviter"}
                    </button>
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => {
                        setShowForm(false);
                        setEmail("");
                        setDisplayName("");
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </AdminFormCard>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--graphite)]/70">
            Seuls les administrateurs peuvent inviter de nouveaux membres.
          </p>
        )}

        {loading ? (
          <AdminLoading label="Chargement des membres…" />
        ) : (
          <AdminTableWrap>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className={thClass}>E-mail</th>
                  <th className={thClass}>Nom</th>
                  <th className={thClass}>Rôle</th>
                  <th className={thClass}>Statut</th>
                  {canManage ? <th className={thClass}>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className={rowHover}>
                    <td className={tdClass}>{m.email}</td>
                    <td className={tdClass}>{m.displayName || "—"}</td>
                    <td className={tdClass}>{ROLE_LABELS[m.role] ?? m.role}</td>
                    <td className={tdClass}>
                      {m.status === "active" ? (
                        <span className="text-emerald-700">Actif</span>
                      ) : (
                        <span className="text-amber-700">Invité</span>
                      )}
                    </td>
                    {canManage ? (
                      <td className={tdClass}>
                        {m.role !== "owner" ? (
                          <button type="button" className={btnDanger} onClick={() => void handleRemove(m)}>
                            Retirer
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--graphite)]/50">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        )}
      </div>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </>
  );
}
