"use client";

import { useEffect, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import type { AdminProject } from "@/components/admin/operations-types";
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceMovement,
  FinanceMovementType,
  FinancePaymentMethod,
} from "@/lib/admin/finance-types";
import { FINANCE_MOVEMENT_TYPE_LABELS } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

type Referential = {
  projects: AdminProject[];
  customers: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
};

export function FinanceMovementForm({
  accounts,
  categories,
  defaultAccountId,
  defaultType = "expense",
  referential,
  onSaved,
  title = "Nouveau mouvement",
}: {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  defaultAccountId?: string;
  defaultType?: FinanceMovementType;
  referential: Referential;
  onSaved: () => void;
  title?: string;
}) {
  const toast = useAdminToast();
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState(defaultAccountId ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [movementType, setMovementType] = useState<FinanceMovementType>(defaultType);
  const [amount, setAmount] = useState(0);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<FinancePaymentMethod>("cash");
  const [projectId, setProjectId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [virementRef, setVirementRef] = useState("");
  const [effectRef, setEffectRef] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [amountHt, setAmountHt] = useState<number | "">("");
  const [vatAmount, setVatAmount] = useState<number | "">("");

  useEffect(() => {
    if (defaultAccountId) setAccountId(defaultAccountId);
  }, [defaultAccountId]);

  const filteredCategories = categories.filter((c) => {
    if (c.direction === "both") return true;
    if (movementType === "income" || movementType === "transfer_in") return c.direction === "income";
    if (movementType === "expense" || movementType === "transfer_out") return c.direction === "expense";
    return true;
  });

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/admin/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        categoryId,
        movementType,
        amount,
        movementDate,
        reference,
        paymentMethod,
        projectId: projectId || null,
        customerId: customerId || null,
        supplierId: supplierId || null,
        chequeNumber: chequeNumber || null,
        virementRef: virementRef || null,
        effectRef: effectRef || null,
        notes: notes || null,
        receiptUrl: receiptUrl || null,
        amountHt: amountHt === "" ? null : amountHt,
        vatAmount: vatAmount === "" ? null : vatAmount,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Mouvement enregistré.");
    setAmount(0);
    setReference("");
    setNotes("");
    onSaved();
  }

  return (
    <AdminFormCard
      title={title}
      footer={
        <div className="flex gap-2">
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      }
    >
      <div className={formGridClass}>
        <div>
          <p className={labelClass}>Compte</p>
          <select className={`${inputClass} mt-1`} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Sélectionner…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.balance?.toLocaleString("fr-MA") ?? 0} MAD)
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={labelClass}>Type</p>
          <select
            className={`${inputClass} mt-1`}
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as FinanceMovementType)}
          >
            {(["income", "expense"] as FinanceMovementType[]).map((t) => (
              <option key={t} value={t}>
                {FINANCE_MOVEMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={labelClass}>Catégorie</p>
          <select className={`${inputClass} mt-1`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sélectionner…</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={labelClass}>Montant (MAD)</p>
          <input
            type="number"
            min={0}
            step={0.01}
            className={`${inputClass} mt-1`}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <p className={labelClass}>Date</p>
          <input
            type="date"
            className={`${inputClass} mt-1`}
            value={movementDate}
            onChange={(e) => setMovementDate(e.target.value)}
          />
        </div>
        <div>
          <p className={labelClass}>Référence</p>
          <input className={`${inputClass} mt-1`} value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
        <div>
          <p className={labelClass}>Mode de paiement</p>
          <select
            className={`${inputClass} mt-1`}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as FinancePaymentMethod)}
          >
            <option value="cash">Espèces</option>
            <option value="bank">Banque</option>
            <option value="cheque">Chèque</option>
            <option value="transfer">Virement</option>
            <option value="effect">Effet / traite</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}>Chantier (optionnel)</p>
          <ProjectSelect
            projects={referential.projects}
            value={projectId}
            onChange={setProjectId}
            placeholder="Aucun chantier"
          />
        </div>
        <div>
          <p className={labelClass}>Client (optionnel)</p>
          <select className={`${inputClass} mt-1`} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">—</option>
            {referential.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={labelClass}>Fournisseur (optionnel)</p>
          <select className={`${inputClass} mt-1`} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">—</option>
            {referential.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {paymentMethod === "cheque" ? (
          <div>
            <p className={labelClass}>N° chèque</p>
            <input className={`${inputClass} mt-1`} value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
          </div>
        ) : null}
        {paymentMethod === "transfer" ? (
          <div>
            <p className={labelClass}>Réf. virement</p>
            <input className={`${inputClass} mt-1`} value={virementRef} onChange={(e) => setVirementRef(e.target.value)} />
          </div>
        ) : null}
        {paymentMethod === "effect" ? (
          <div>
            <p className={labelClass}>Réf. effet / traite</p>
            <input className={`${inputClass} mt-1`} value={effectRef} onChange={(e) => setEffectRef(e.target.value)} />
          </div>
        ) : null}
        <div>
          <p className={labelClass}>Montant HT (optionnel)</p>
          <input
            type="number"
            min={0}
            className={`${inputClass} mt-1`}
            value={amountHt}
            onChange={(e) => setAmountHt(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div>
          <p className={labelClass}>TVA (optionnel)</p>
          <input
            type="number"
            min={0}
            className={`${inputClass} mt-1`}
            value={vatAmount}
            onChange={(e) => setVatAmount(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}>Notes</p>
          <textarea className={`${inputClass} mt-1`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}>Justificatif (URL)</p>
          <input className={`${inputClass} mt-1`} value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="Lien reçu / scan" />
        </div>
      </div>
    </AdminFormCard>
  );
}

export function FinanceJournalTable({
  movements,
  onVoid,
}: {
  movements: FinanceMovement[];
  onVoid?: (id: string) => void;
}) {
  return (
    <AdminTableWrap>
      <thead>
        <tr>
          <th className={thClass}>Date</th>
          <th className={thClass}>Réf.</th>
          <th className={thClass}>Type</th>
          <th className={thClass}>Catégorie</th>
          <th className={thClass}>Montant</th>
          <th className={thClass}>Chantier</th>
          <th className={thClass} />
        </tr>
      </thead>
      <tbody>
        {movements.map((m) => (
          <tr key={m.id} className={rowHover}>
            <td className={tdClass}>{m.movementDate}</td>
            <td className={tdClass}>{m.reference}</td>
            <td className={tdClass}>{FINANCE_MOVEMENT_TYPE_LABELS[m.movementType]}</td>
            <td className={tdClass}>{m.categoryName ?? "—"}</td>
            <td className={tdClass}>{m.amount.toLocaleString("fr-MA")} MAD</td>
            <td className={tdClass}>{m.projectName ?? "—"}</td>
            <td className={tdClass}>
              {onVoid && !m.voidedAt ? (
                <button type="button" className={btnSecondary} onClick={() => onVoid(m.id)}>
                  Annuler
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTableWrap>
  );
}
