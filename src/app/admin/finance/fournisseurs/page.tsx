import { redirect } from "next/navigation";

function redirectToFactures(
  tab: "clients" | "fournisseurs",
  searchParams: { [key: string]: string | string[] | undefined },
) {
  const qs = new URLSearchParams();
  qs.set("tab", tab);
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "tab" || value == null) continue;
    qs.set(key, Array.isArray(value) ? value[0]! : value);
  }
  redirect(`/admin/finance/factures?${qs.toString()}`);
}

export default async function AdminFinanceSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  redirectToFactures("fournisseurs", await searchParams);
}
