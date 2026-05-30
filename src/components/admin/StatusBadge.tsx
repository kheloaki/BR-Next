import type { StockStatus, PurchaseRequestStatus, TripStatus, RentalEquipmentStatus } from "@/components/admin/operations-types";
import {
  PURCHASE_STATUS_LABELS,
  STOCK_STATUS_LABELS,
} from "@/components/admin/operations-types";

const stockClass: Record<StockStatus, string> = {
  ok: "bg-emerald-50 text-emerald-800",
  low: "bg-amber-50 text-amber-900",
  out: "bg-red-50 text-red-800",
};

const purchaseClass: Record<PurchaseRequestStatus, string> = {
  pending: "bg-[#fff4e8] text-[#b04a09]",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
};

const tripClass: Record<TripStatus, string> = {
  delivered: "bg-emerald-50 text-emerald-800",
  in_transit: "bg-blue-50 text-blue-800",
  arrived: "bg-emerald-50 text-emerald-800",
};

const rentalClass: Record<RentalEquipmentStatus, string> = {
  active: "bg-emerald-50 text-emerald-800",
  maintenance: "bg-amber-50 text-amber-900",
  down: "bg-red-50 text-red-800",
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stockClass[status]}`}>
      {STOCK_STATUS_LABELS[status]}
    </span>
  );
}

export function PurchaseStatusBadge({ status }: { status: PurchaseRequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${purchaseClass[status]}`}>
      {PURCHASE_STATUS_LABELS[status]}
    </span>
  );
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const labels = { delivered: "Livré", in_transit: "En route", arrived: "Arrivé" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tripClass[status]}`}>
      {labels[status]}
    </span>
  );
}

export function RentalStatusBadge({ status }: { status: RentalEquipmentStatus }) {
  const labels = { active: "Actif", maintenance: "Maintenance", down: "En panne" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${rentalClass[status]}`}>
      {labels[status]}
    </span>
  );
}
