import type { AdminEquipment } from "@/components/admin/operations-types";
import { inputClass } from "@/components/admin/admin-form-styles";
import { ReferentialEmptyHint } from "@/components/admin/ReferentialEmptyHint";

export function EquipmentSelect({
  equipment,
  value,
  onChange,
  activeOnly = true,
}: {
  equipment: AdminEquipment[];
  value: string;
  onChange: (id: string) => void;
  activeOnly?: boolean;
}) {
  const list = activeOnly ? equipment.filter((e) => e.active) : equipment;
  if (list.length === 0) {
    return <ReferentialEmptyHint label="matériel" managePage="rental-materials" />;
  }
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Engin…</option>
      {list.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
          {e.type ? ` (${e.type})` : ""}
        </option>
      ))}
    </select>
  );
}
