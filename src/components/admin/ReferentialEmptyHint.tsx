import Link from "next/link";

export function ReferentialEmptyHint({
  label,
  managePage,
  projects,
}: {
  label: string;
  managePage?: "rental-materials" | "personnel";
  projects?: boolean;
}) {
  const href = projects
    ? "/admin/projets"
      : managePage === "personnel"
        ? "/admin/personnel"
        : managePage === "rental-materials"
          ? "/admin/equipment-rental/materials"
          : "/admin/equipment-rental/materials";
  const linkLabel = projects
    ? "Créer un projet"
    : managePage === "personnel"
      ? "Ajouter au personnel"
      : "Créer du matériel";
  return (
    <p className="rounded-md border border-[#f0d4b8] bg-[#fff8f0] px-3 py-2 text-sm text-[#7a3d12]">
      Aucun {label} enregistré.{" "}
      <Link href={href} className="font-medium underline underline-offset-2">
        {linkLabel}
      </Link>
    </p>
  );
}
