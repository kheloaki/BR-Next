import type { StockMovement } from "@/components/admin/operations-types";

export function gasoilMovementOrigin(movement: StockMovement): string {
  const bonRef = movement.deliveryNote?.trim() || movement.notes.split(" · ")[0]?.trim() || "";
  if (movement.notes.includes("Annulation")) {
    return bonRef ? `Annulation ${bonRef}` : "Annulation bon";
  }
  if (movement.movementType === "entry" || movement.movementType === "return") {
    return bonRef ? `Bon de commande ${bonRef}` : "Bon de commande";
  }
  if (movement.movementType === "exit") {
    return bonRef ? `Bon de sortie ${bonRef}` : "Bon de sortie";
  }
  return bonRef || "—";
}

export function gasoilMovementDetail(movement: StockMovement): string {
  if (movement.notes.includes("Annulation")) return movement.notes;
  if (movement.movementType === "entry" || movement.movementType === "return") {
    return movement.supplier.trim() || "—";
  }
  const beneficiary = movement.notes.match(/Bénéf\. (.+)/)?.[1]?.split(" · ")[0];
  return beneficiary?.trim() || movement.notes.split(" · ").find((p) => p.startsWith("Bénéf."))?.replace("Bénéf. ", "") || "—";
}
