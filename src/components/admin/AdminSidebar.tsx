import Link from "next/link";
import Image from "next/image";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";

export type AdminSection =
  | "dashboard"
  | "builder"
  | "saved"
  | "products"
  | "customers";

function itemClass(active: boolean) {
  return active
    ? "block rounded-md border border-[var(--gold)]/45 bg-[var(--gold)]/10 px-3 py-2 font-medium text-[var(--navy)]"
    : "block rounded-md border border-transparent px-3 py-2 text-[var(--graphite)]/85 hover:border-border hover:bg-white";
}

export function AdminSidebar({ active }: { active: AdminSection }) {
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
        <p className="block rounded-md px-3 py-2 text-[var(--graphite)]/60">Parametres</p>
        <p className="block rounded-md px-3 py-2 text-[var(--graphite)]/60">
          Transactions bancaires
        </p>
        <div className="h-px bg-border my-3" />
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/60 px-1">
          Facturation client
        </p>
        <Link href="/admin/devis-builder" className={itemClass(active === "builder")}>
          Devis
        </Link>
        <Link href="/admin/customers" className={itemClass(active === "customers")}>
          Clients
        </Link>
        <Link href="/admin/products" className={itemClass(active === "products")}>
          Produits
        </Link>
        <Link href="/admin/devis-saved" className={itemClass(active === "saved")}>
          Devis enregistres
        </Link>
      </nav>

      <div className="mt-auto border border-border rounded-md bg-white px-3 py-2">
        <p className="text-sm font-medium text-[var(--navy)]">Utilisateur admin</p>
        <p className="text-xs text-[var(--graphite)]/70">panel@baraneinvest.com</p>
      </div>
    </aside>
  );
}
