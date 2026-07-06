import Link from "next/link";
import { alertWarning } from "@/components/admin/admin-form-styles";

export function ReferentialBanner({
  sitesCount,
  equipmentCount = 1,
  employeesCount = 1,
  requireSites = true,
  requireEquipment = false,
  requireEmployees = false,
}: {
  sitesCount?: number;
  equipmentCount?: number;
  employeesCount?: number;
  requireSites?: boolean;
  requireEquipment?: boolean;
  requireEmployees?: boolean;
}) {
  const missing: string[] = [];
  if (requireSites && (sitesCount ?? 0) === 0) missing.push("chantiers");
  if (requireEquipment && equipmentCount === 0) missing.push("matériel en location");
  if (requireEmployees && employeesCount === 0) missing.push("personnel");
  if (missing.length === 0) return null;

  const showProjects = requireSites && (sitesCount ?? 0) === 0;
  const showEngins = requireEquipment && equipmentCount === 0;
  const showPersonnel = requireEmployees && employeesCount === 0;

  return (
    <div className={`mb-4 ${alertWarning}`}>
      <p className="font-medium">Configuration requise</p>
      <p className="mt-1 opacity-90">
        Ajoutez : {missing.join(", ")}. Les listes déroulantes des autres modules en dépendent.
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {showProjects ? (
          <Link href="/admin/projets" className="text-sm font-medium text-[var(--admin-accent)] hover:underline">
            Projets →
          </Link>
        ) : null}
        {showEngins ? (
          <Link
            href="/admin/equipment-rental/materials"
            className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
          >
            Matériel location →
          </Link>
        ) : null}
        {showPersonnel ? (
          <Link href="/admin/personnel" className="text-sm font-medium text-[var(--admin-accent)] hover:underline">
            Personnel →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
