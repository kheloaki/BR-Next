import type { AdminEmployee } from "@/components/admin/operations-types";
import { inputClass } from "@/components/admin/admin-form-styles";
import { ReferentialEmptyHint } from "@/components/admin/ReferentialEmptyHint";

export function EmployeeSelect({
  employees,
  value,
  onChange,
}: {
  employees: AdminEmployee[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (employees.length === 0) {
    return <ReferentialEmptyHint label="collaborateur" managePage="personnel" />;
  }
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Employé…</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>
          {e.matricule ? `${e.matricule} — ` : ""}
          {e.name}
          {e.role ? ` (${e.role})` : ""}
        </option>
      ))}
    </select>
  );
}
