import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";
import { AdminNavLinks } from "@/components/admin/AdminNavLinks";

export type AdminSection =
  | "dashboard"
  | "builder"
  | "builder-devis"
  | "builder-bon-commande"
  | "builder-facture"
  | "builder-bon-livraison"
  | "saved"
  | "products"
  | "customers"
  | "suppliers"
  | "stock"
  | "traitements-achat"
  | "traitements-vente"
  | "purchase-requests"
  | "parts"
  | "fuel"
  | "fuel-consommation"
  | "fuel-stock"
  | "fuel-bons"
  | "fuel-commande"
  | "finance-caisse"
  | "finance-banque"
  | "finance-tresorerie"
  | "finance-clients"
  | "finance-fournisseurs"
  | "finance-depenses"
  | "finance-clotures"
  | "finance-etats"
  | "drilling"
  | "production"
  | "logistics"
  | "equipment-rental"
  | "rental-materials"
  | "rental-bons"
  | "hr"
  | "engins"
  | "personnel"
  | "projets"
  | "depots"
  | "etats"
  | "pv"
  | "rapports"
  | "utilisateurs";

function resolveUserDisplay(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return { name: "Utilisateur admin", email: "", initial: "?" };
  }
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? "";
  const fallbackName = primaryEmail || "Utilisateur admin";
  const name = fullName || fallbackName;
  const initialSource = fullName || primaryEmail || "?";
  const initial = initialSource.charAt(0).toUpperCase();
  return { name, email: primaryEmail, initial };
}

export async function AdminSidebar({ active }: { active: AdminSection }) {
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  const { name, email, initial } = resolveUserDisplay(user);

  return (
    <div className="flex h-full min-h-[calc(100dvh-3.5rem)] lg:min-h-screen flex-col overflow-y-auto bg-[var(--background)] p-4">
      <div className="flex items-center gap-2 px-2">
        <Image src={logoFooter} alt="BARANE INVEST" width={26} height={26} className="h-6 w-6 object-contain" />
        <div>
          <p className="text-sm font-semibold leading-none text-[var(--navy)]">BARANE</p>
          <p className="mt-0.5 text-[11px] leading-none text-[var(--graphite)]/70">INVEST</p>
        </div>
      </div>

      <div className="mt-6 flex-1">
        <AdminNavLinks active={active} />
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-sm font-semibold text-[var(--navy)]">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--navy)]">{name}</p>
          {email ? (
            <p className="truncate text-xs text-[var(--graphite)]/70">{email}</p>
          ) : (
            <p className="truncate text-xs text-[var(--graphite)]/70">Compte administrateur</p>
          )}
        </div>
      </div>
    </div>
  );
}
