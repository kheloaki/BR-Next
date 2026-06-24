"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  card,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { OrganizationMembersSkeleton } from "@/components/admin/skeletons/pages";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import type { AssignableMemberRole } from "@/lib/admin/organization";

type OrgMember = {
  id: string;
  userId: string | null;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  status: "active" | "invited";
};

type OrgContext = {
  userId: string;
  role: string;
  canManageMembers: boolean;
  organizationName: string;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
  financier: "Financier",
  accountant: "Comptable",
  project_manager: "Chef de projet",
};

const ASSIGNABLE_ROLES: AssignableMemberRole[] = [
  "member",
  "admin",
  "financier",
  "accountant",
  "project_manager",
];

const ROLE_PERMISSIONS: { role: string; summary: string }[] = [
  {
    role: "Propriétaire",
    summary: "Accès total — utilisateurs, finance, rapports, modèles, PV.",
  },
  {
    role: "Administrateur",
    summary: "Gestion utilisateurs, finance, opérations, signature PV. Pas les modèles de rapports.",
  },
  {
    role: "Financier",
    summary: "Module Finance complet (caisse, banque, clients, fournisseurs, clôtures, états).",
  },
  {
    role: "Comptable",
    summary: "Consultation et saisie finance (mouvements, états). Pas de void ni clôture.",
  },
  {
    role: "Chef de projet",
    summary: "Opérations + rentabilité chantier (finance projet). Pas le module Finance global.",
  },
  {
    role: "Membre",
    summary: "Opérations, commercial, stock, carburant — sans Finance ni gestion utilisateurs.",
  },
];

export function OrganizationMembersManager() {
  const toast = useAdminToast();
  const [rows, setRows] = useState<OrgMember[]>([]);
  const [ctx, setCtx] = useState<OrgContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [memberRole, setMemberRole] = useState<AssignableMemberRole>("member");
  const [showForm, setShowForm] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});

  const canManage = ctx?.canManageMembers ?? false;
  const isOwner = ctx?.role === "owner";

  const roleOptions = useMemo(
    () => Object.fromEntries(ASSIGNABLE_ROLES.map((r) => [r, ROLE_LABELS[r] ?? r])),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [membersRes, contextRes] = await Promise.all([
      fetch("/api/admin/organization/members", { cache: "no-store" }),
      fetch("/api/admin/organization/context", { cache: "no-store" }),
    ]);

    if (contextRes.ok) {
      const data = (await contextRes.json()) as OrgContext;
      setCtx(data);
    }

    if (membersRes.ok) {
      const members = (await membersRes.json()) as OrgMember[];
      setRows(members);
      setNameDrafts(Object.fromEntries(members.map((m) => [m.id, m.displayName])));
    } else {
      toast.error(await readApiError(membersRes));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function patchMember(
    member: OrgMember,
    patch: { memberRole?: AssignableMemberRole; displayName?: string; transferOwnership?: boolean },
  ) {
    setUpdatingId(member.id);
    const res = await fetch("/api/admin/organization/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, ...patch }),
    });
    if (res.ok) {
      if (patch.transferOwnership) {
        toast.success("Propriété transférée — votre rôle est maintenant Administrateur.");
      } else if (patch.memberRole) {
        toast.success(`Rôle mis à jour : ${ROLE_LABELS[patch.memberRole] ?? patch.memberRole}`);
      } else {
        toast.success("Nom mis à jour");
      }
      await load();
    } else {
      toast.error(await readApiError(res));
    }
    setUpdatingId(null);
  }

  async function handleRoleChange(member: OrgMember, nextRole: AssignableMemberRole) {
    if (nextRole === member.role) return;
    await patchMember(member, { memberRole: nextRole });
  }

  async function handleNameSave(member: OrgMember) {
    const draft = (nameDrafts[member.id] ?? "").trim();
    const current = member.displayName.trim();
    if (draft === current) return;
    await patchMember(member, { displayName: draft || member.email });
  }

  async function handleTransferOwnership(member: OrgMember) {
    if (
      !(await confirmDelete(
        `Transférer la propriété à ${member.displayName || member.email} ? Vous deviendrez Administrateur.`,
      ))
    ) {
      return;
    }
    await patchMember(member, { transferOwnership: true });
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
        description="Membres de l'espace BARANE INVEST — rôles, invitations et accès aux modules."
      />

      <div className={`${moduleWrap} mt-4 space-y-4`}>
        {ctx ? (
          <div className={`${card} flex flex-wrap items-center justify-between gap-3 bg-[var(--background)]/60`}>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">
                {ctx.organizationName}
              </p>
              <p className="mt-1 text-sm text-[var(--navy)]">
                Votre rôle :{" "}
                <span className="font-semibold">{ROLE_LABELS[ctx.role] ?? ctx.role}</span>
                {!canManage ? (
                  <span className="ml-2 text-[var(--graphite)]/70">
                    — lecture seule (contactez un administrateur pour modifier les rôles)
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setShowPermissions((v) => !v)}
            >
              {showPermissions ? "Masquer les rôles" : "Guide des rôles"}
            </button>
          </div>
        ) : null}

        {showPermissions ? (
          <AdminFormCard title="Guide des rôles">
            <ul className="space-y-2 text-sm text-[var(--graphite)]">
              {ROLE_PERMISSIONS.map((item) => (
                <li key={item.role}>
                  <span className="font-medium text-[var(--navy)]">{item.role}</span>
                  {" — "}
                  {item.summary}
                </li>
              ))}
            </ul>
          </AdminFormCard>
        ) : null}

        <p className="text-sm text-[var(--graphite)]/80">
          Invitez un collègue par e-mail. À la première connexion avec le même compte Clerk, il accèdera
          automatiquement aux données de l&apos;organisation avec le rôle choisi.
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
                    <SearchableEnumSelect
                      options={roleOptions}
                      value={memberRole}
                      onChange={(v) => setMemberRole(v as AssignableMemberRole)}
                      inputClassName={inputClass}
                      allowEmpty={false}
                    />
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
            Seuls les administrateurs et le propriétaire peuvent inviter des membres ou modifier les rôles.
          </p>
        )}

        {loading ? (
          <OrganizationMembersSkeleton />
        ) : (
          <AdminTableWrap>
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
                {rows.map((m) => {
                  const isSelf = m.userId !== null && m.userId === ctx?.userId;
                  const isUpdating = updatingId === m.id;
                  const canEditRole = canManage && m.role !== "owner" && !isSelf;
                  const canEditName = canManage;
                  const canTransfer = isOwner && !isSelf && m.role !== "owner" && m.status === "active";
                  const canRemove = canManage && m.role !== "owner" && !isSelf;

                  return (
                    <tr key={m.id} className={rowHover}>
                      <td className={tdTextClass}>
                        <AdminTruncatedText text={m.email} lines={1} />
                        {isSelf ? (
                          <span className="ml-2 rounded bg-[var(--gold)]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--navy)]">
                            Vous
                          </span>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        {canEditName ? (
                          <input
                            className={`${inputClass} min-h-[36px] py-1.5`}
                            value={nameDrafts[m.id] ?? m.displayName}
                            disabled={isUpdating}
                            onChange={(e) =>
                              setNameDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))
                            }
                            onBlur={() => void handleNameSave(m)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                          />
                        ) : (
                          <AdminTruncatedText text={m.displayName} lines={1} />
                        )}
                      </td>
                      <td className={tdClass}>
                        {canEditRole ? (
                          <SearchableEnumSelect
                            options={roleOptions}
                            value={ASSIGNABLE_ROLES.includes(m.role as AssignableMemberRole) ? m.role : "member"}
                            onChange={(v) => void handleRoleChange(m, v as AssignableMemberRole)}
                            inputClassName={`${inputClass} min-h-[36px] py-1.5`}
                            disabled={isUpdating}
                            allowEmpty={false}
                            compact
                          />
                        ) : (
                          ROLE_LABELS[m.role] ?? m.role
                        )}
                      </td>
                      <td className={tdClass}>
                        {m.status === "active" ? (
                          <span className="text-emerald-700">Actif</span>
                        ) : (
                          <span className="text-amber-700">Invité</span>
                        )}
                      </td>
                      {canManage ? (
                        <td className={tdClass}>
                          <div className="flex flex-wrap items-center gap-2">
                            {canTransfer ? (
                              <button
                                type="button"
                                className={btnSecondary}
                                disabled={isUpdating}
                                onClick={() => void handleTransferOwnership(m)}
                              >
                                Transférer propriété
                              </button>
                            ) : null}
                            {canRemove ? (
                              <button
                                type="button"
                                className={btnDanger}
                                disabled={isUpdating}
                                onClick={() => void handleRemove(m)}
                              >
                                Retirer
                              </button>
                            ) : null}
                            {!canTransfer && !canRemove ? (
                              <span className="text-xs text-[var(--graphite)]/50">—</span>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
            </tbody>
          </AdminTableWrap>
        )}
      </div>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </>
  );
}
