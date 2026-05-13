import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";

export type AdminSection =
  | "dashboard"
  | "builder"
  | "saved"
  | "products"
  | "customers"
  | "suppliers";

function itemClass(active: boolean) {
  return active
    ? "block rounded-md border border-[var(--gold)]/45 bg-[var(--gold)]/10 px-3 py-2 font-medium text-[var(--navy)]"
    : "block rounded-md border border-transparent px-3 py-2 text-[var(--graphite)]/85 hover:border-border hover:bg-white";
}

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
    <aside className="border border-border bg-[#f3f3f3] p-4 h-fit lg:sticky lg:top-5 min-h-[calc(100vh-2.5rem)] flex flex-col">
      <div className="flex items-center gap-2 px-2">
        <Image src={logoFooter} alt="BARANE INVEST" width={26} height={26} className="h-6 w-6 object-contain" />
        <div>
          <p className="text-sm font-semibold text-[var(--navy)] leading-none">BARANE</p>
          <p className="text-[11px] text-[var(--graphite)]/70 leading-none mt-0.5">INVEST</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1 text-sm">
        <Link href="/admin" className={itemClass(active === "dashboard")}>
          Accueil
        </Link>
        <div className="h-px bg-border my-3" />
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/60 px-1">
          Facturation
        </p>
        <Link href="/admin/devis-builder" className={itemClass(active === "builder")}>
          Devis / Bon de commande
        </Link>
        <Link href="/admin/devis-saved" className={itemClass(active === "saved")}>
          Documents enregistrés
        </Link>
        <div className="h-px bg-border my-3" />
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/60 px-1">
          Carnet
        </p>
        <Link href="/admin/customers" className={itemClass(active === "customers")}>
          Clients
        </Link>
        <Link href="/admin/suppliers" className={itemClass(active === "suppliers")}>
          Fournisseurs
        </Link>
        <Link href="/admin/products" className={itemClass(active === "products")}>
          Produits
        </Link>
      </nav>

      <div className="mt-auto border border-border rounded-md bg-white px-3 py-2 flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--gold)]/15 text-[var(--navy)] font-semibold text-sm flex items-center justify-center">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--navy)] truncate">{name}</p>
          {email ? (
            <p className="text-xs text-[var(--graphite)]/70 truncate">{email}</p>
          ) : (
            <p className="text-xs text-[var(--graphite)]/70 truncate">Compte administrateur</p>
          )}
        </div>
      </div>
    </aside>
  );
}
