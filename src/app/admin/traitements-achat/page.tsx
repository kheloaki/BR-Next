import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TraitementAchatRedirectPage({ searchParams }: Props) {
  await requireAdminPage("/admin/traitements-achat");
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("type", "achat");
  for (const [key, value] of Object.entries(params)) {
    if (key === "type" || value === undefined) continue;
    qs.set(key, Array.isArray(value) ? value[0]! : value);
  }
  redirect(`/admin/traitements?${qs.toString()}`);
}
