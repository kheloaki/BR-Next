import { NextResponse } from "next/server";
import type { GasoilBonType, GasoilVehicleCategory } from "@/components/admin/operations-types";
import { nextBonCommandeDocumentNo, nextBonGasoilNumber, resolveBonGasoilNo } from "@/lib/admin/bon-gasoil-number";
import { yearFromDate } from "@/lib/admin/document-number";
import {
  deleteFuelEntryForBon,
} from "@/lib/admin/fuel-bon-sync";
import { GASOIL_BON_TYPES, GASOIL_VEHICLE_CATEGORIES, gasoilBonPriceFields } from "@/lib/admin/gasoil-bon";
import { applyGasoilStockForBon, reverseGasoilStockForBon } from "@/lib/admin/gasoil-stock-server";
import { resolveMaterialFields } from "@/lib/admin/material-resolve";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function resolveGasoilContact(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  contactId: string | undefined,
  fallbackName: string,
) {
  const trimmed = contactId?.trim() || "";
  if (!trimmed) {
    return { id: null as string | null, name: fallbackName.trim() };
  }
  const { data } = await supabase
    .from("admin_gasoil_contacts")
    .select("id, name")
    .eq("id", trimmed)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) {
    return { id: null as string | null, name: fallbackName.trim() };
  }
  return { id: data.id as string, name: data.name as string };
}

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    number: r.number as string,
    bonType: r.bon_type as GasoilBonType,
    vehicleCategory: r.vehicle_category as GasoilVehicleCategory,
    projectId: (r.project_id as string) || null,
    materialId: (r.material_id as string) || null,
    equipmentId: (r.equipment_id as string) || null,
    vehicleLabel: (r.vehicle_label as string) || "",
    equipmentName: (r.equipment_name as string) || "",
    siteName: (r.site_name as string) || "",
    bonDate: r.bon_date as string,
    litres: Number(r.litres ?? 0),
    pumpMeter: r.pump_meter != null ? Number(r.pump_meter) : null,
    supplier: (r.supplier as string) || "",
    beneficiary: (r.beneficiary as string) || "",
    driverContactId: (r.driver_contact_id as string) || null,
    pompisteContactId: (r.pompiste_contact_id as string) || null,
    fuelTime: (r.fuel_time as string) || "",
    deliveryNote: (r.delivery_note as string) || "",
    notes: (r.notes as string) || "",
    fuelEntryId: (r.fuel_entry_id as string) || null,
    unitPrice: Number(r.unit_price ?? 0),
    totalAmount: Number(r.total_amount ?? 0),
    traitementId: (r.traitement_id as string) || null,
    createdAt: r.created_at as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const bonType = searchParams.get("bonType");
  const vehicleCategory = searchParams.get("vehicleCategory");
  const nextPreview = searchParams.get("next") === "1";

  if (nextPreview) {
    const type = (bonType === "achat" || bonType === "sortie" ? bonType : "achat") as GasoilBonType;
    const number =
      type === "achat"
        ? await nextBonCommandeDocumentNo(organizationId)
        : await nextBonGasoilNumber(organizationId);
    return NextResponse.json({ number });
  }

  let query = getSupabaseAdminClient()
    .from("admin_gasoil_bons")
    .select("*")
    .eq("organization_id", organizationId)
    .order("bon_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (bonType && GASOIL_BON_TYPES.includes(bonType as GasoilBonType)) {
    query = query.eq("bon_type", bonType);
  }
  if (vehicleCategory && GASOIL_VEHICLE_CATEGORIES.includes(vehicleCategory as GasoilVehicleCategory)) {
    query = query.eq("vehicle_category", vehicleCategory);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => mapRow(r as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    number?: string;
    bonType?: GasoilBonType;
    vehicleCategory?: GasoilVehicleCategory;
    projectId?: string;
    materialId?: string;
    equipmentId?: string;
    equipmentName?: string;
    vehicleLabel?: string;
    bonDate?: string;
    litres?: number;
    pumpMeter?: number;
    supplier?: string;
    beneficiary?: string;
    driverContactId?: string;
    pompisteContactId?: string;
    fuelTime?: string;
    deliveryNote?: string;
    notes?: string;
    syncStock?: boolean;
    unitPricePerLitre?: number;
  };

  if (!body.bonType || !GASOIL_BON_TYPES.includes(body.bonType)) {
    return NextResponse.json({ error: "Type de bon requis (achat ou sortie)" }, { status: 400 });
  }

  const vehicleCategory =
    body.vehicleCategory && GASOIL_VEHICLE_CATEGORIES.includes(body.vehicleCategory)
      ? body.vehicleCategory
      : "engin";

  if (
    body.bonType === "sortie" &&
    (!body.vehicleCategory || !GASOIL_VEHICLE_CATEGORIES.includes(body.vehicleCategory))
  ) {
    return NextResponse.json({ error: "Catégorie véhicule requise" }, { status: 400 });
  }
  if (!body.projectId) {
    return NextResponse.json({ error: "Chantier requis" }, { status: 400 });
  }

  const litres = Math.max(0, Number(body.litres) || 0);
  if (litres <= 0) {
    return NextResponse.json({ error: "Quantité en litres requise" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(supabase, organizationId, body.projectId);

  const isAchat = body.bonType === "achat";
  const material = isAchat
    ? { material_id: null, equipment_name: "", vehicle_label: "" }
    : await resolveMaterialFields(supabase, organizationId, body.materialId);

  const equipmentName = isAchat
    ? ""
    : material.equipment_name ||
      body.equipmentName?.trim() ||
      body.vehicleLabel?.trim() ||
      "";
  const vehicleLabel = isAchat ? "" : body.vehicleLabel?.trim() || material.vehicle_label || "";

  if (!isAchat) {
    if (!material.material_id && !body.equipmentId && !vehicleLabel) {
      return NextResponse.json(
        { error: "Sélectionnez un matériel du catalogue ou saisissez une identification." },
        { status: 400 },
      );
    }
  }

  const bonDate = body.bonDate || new Date().toISOString().slice(0, 10);
  const number = await resolveBonGasoilNo(
    organizationId,
    body.number,
    body.bonType,
    yearFromDate(bonDate),
  );
  const pumpMeter =
    body.pumpMeter != null && !Number.isNaN(Number(body.pumpMeter)) ? Number(body.pumpMeter) : null;
  const syncStock = body.syncStock !== false;
  const bonId = opsId("bon");

  let supplierName: string;
  let driver: { id: string | null; name: string };
  let pompisteContactId: string | null;

  if (isAchat) {
    supplierName = body.supplier?.trim() || "";
    driver = { id: null, name: "" };
    pompisteContactId = null;
  } else {
    const pompiste = await resolveGasoilContact(
      supabase,
      organizationId,
      body.pompisteContactId,
      body.supplier ?? "",
    );
    driver = await resolveGasoilContact(
      supabase,
      organizationId,
      body.driverContactId,
      body.beneficiary ?? "",
    );
    supplierName = pompiste.name;
    pompisteContactId = pompiste.id;
  }

  try {
    const shouldSyncStock = isAchat || syncStock;
    let appliedUnitPrice = 0;
    if (shouldSyncStock) {
      const stockResult = await applyGasoilStockForBon(supabase, organizationId, userId, {
        bonType: body.bonType,
        litres,
        projectId: body.projectId,
        deliveryNote: isAchat ? "" : body.deliveryNote?.trim() || "",
        supplier: supplierName,
        beneficiary: driver.name,
        bonNumber: number,
        bonDate,
        unitPricePerLitre:
          isAchat && body.unitPricePerLitre != null && body.unitPricePerLitre > 0
            ? body.unitPricePerLitre
            : undefined,
      });
      appliedUnitPrice = stockResult?.unitPricePerLitre ?? 0;
    } else if (isAchat && body.unitPricePerLitre != null && body.unitPricePerLitre > 0) {
      appliedUnitPrice = body.unitPricePerLitre;
    }

    if (body.unitPricePerLitre != null && body.unitPricePerLitre > 0) {
      appliedUnitPrice = body.unitPricePerLitre;
    }

    const priceFields =
      appliedUnitPrice > 0 ? gasoilBonPriceFields(litres, appliedUnitPrice) : { unit_price: 0, total_amount: 0 };

    const { data, error } = await supabase
      .from("admin_gasoil_bons")
      .insert({
        id: bonId,
        user_id: userId,
        organization_id: organizationId,
        number,
        bon_type: body.bonType,
        vehicle_category: vehicleCategory,
        project_id: project.project_id,
        material_id: isAchat ? null : material.material_id,
        equipment_id: isAchat ? null : body.equipmentId || null,
        vehicle_label: vehicleLabel,
        equipment_name: equipmentName,
        site_name: project.site_name,
        bon_date: bonDate,
        litres,
        pump_meter: pumpMeter,
        supplier: supplierName,
        beneficiary: driver.name,
        driver_contact_id: driver.id,
        pompiste_contact_id: pompisteContactId,
        fuel_time: isAchat ? "" : body.fuelTime?.trim() || "",
        delivery_note: isAchat ? "" : body.deliveryNote?.trim() || "",
        notes: body.notes?.trim() || "",
        ...priceFields,
      })
      .select("*")
      .single();

    if (error) {
      if (isAchat || syncStock) {
        try {
          await reverseGasoilStockForBon(supabase, organizationId, userId, {
            bonType: body.bonType,
            litres,
            projectId: body.projectId,
            bonNumber: number,
          });
        } catch {
          /* best effort */
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapRow(data as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mise à jour stock impossible" },
      { status: 400 },
    );
  }
}

async function bonHasStockMovement(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  bonNumber: string,
) {
  const { data: stockMoves } = await supabase
    .from("admin_stock_movements")
    .select("id")
    .eq("organization_id", organizationId)
    .or(`delivery_note.eq.${bonNumber},notes.ilike.%${bonNumber}%`)
    .limit(1);
  return (stockMoves?.length ?? 0) > 0;
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    vehicleCategory?: GasoilVehicleCategory;
    projectId?: string;
    materialId?: string;
    equipmentId?: string;
    equipmentName?: string;
    vehicleLabel?: string;
    bonDate?: string;
    litres?: number;
    pumpMeter?: number | null;
    supplier?: string;
    beneficiary?: string;
    driverContactId?: string;
    pompisteContactId?: string;
    fuelTime?: string;
    deliveryNote?: string;
    notes?: string;
    unitPricePerLitre?: number;
  };

  if (!body.id?.trim()) {
    return NextResponse.json({ error: "Identifiant du bon requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: row, error: loadErr } = await supabase
    .from("admin_gasoil_bons")
    .select("*")
    .eq("id", body.id.trim())
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Bon introuvable" }, { status: 404 });

  if (row.traitement_id) {
    return NextResponse.json(
      { error: "Ce bon est lié à un traitement gasoil. Modifiez-le depuis Traitements." },
      { status: 400 },
    );
  }

  const isAchat = row.bon_type === "achat";
  const bonNumber = row.number as string;
  const oldLitres = Math.max(0, Number(row.litres ?? 0));

  const litres = body.litres != null ? Math.max(0, Number(body.litres) || 0) : oldLitres;
  if (litres <= 0) {
    return NextResponse.json({ error: "Quantité en litres requise" }, { status: 400 });
  }

  const projectId = body.projectId?.trim() || (row.project_id as string) || "";
  if (!projectId) {
    return NextResponse.json({ error: "Chantier requis" }, { status: 400 });
  }

  const project = await resolveProjectFields(supabase, organizationId, projectId);
  const vehicleCategory =
    !isAchat && body.vehicleCategory && GASOIL_VEHICLE_CATEGORIES.includes(body.vehicleCategory)
      ? body.vehicleCategory
      : (row.vehicle_category as GasoilVehicleCategory);

  const material = isAchat
    ? { material_id: null, equipment_name: "", vehicle_label: "" }
    : await resolveMaterialFields(
        supabase,
        organizationId,
        body.materialId !== undefined ? body.materialId : (row.material_id as string | null),
      );

  const equipmentName = isAchat
    ? ""
    : material.equipment_name ||
      body.equipmentName?.trim() ||
      body.vehicleLabel?.trim() ||
      (row.equipment_name as string) ||
      "";
  const vehicleLabel = isAchat
    ? ""
    : body.vehicleLabel?.trim() || material.vehicle_label || (row.vehicle_label as string) || "";

  if (!isAchat) {
    const equipmentId = body.equipmentId ?? (row.equipment_id as string | null);
    if (!material.material_id && !equipmentId && !vehicleLabel) {
      return NextResponse.json(
        { error: "Sélectionnez un matériel du catalogue ou saisissez une identification." },
        { status: 400 },
      );
    }
  }

  const bonDate = body.bonDate?.trim() || (row.bon_date as string);
  const pumpMeter =
    body.pumpMeter !== undefined
      ? body.pumpMeter != null && !Number.isNaN(Number(body.pumpMeter))
        ? Number(body.pumpMeter)
        : null
      : row.pump_meter != null
        ? Number(row.pump_meter)
        : null;

  let supplierName: string;
  let driver: { id: string | null; name: string };
  let pompisteContactId: string | null;

  if (isAchat) {
    supplierName = body.supplier !== undefined ? body.supplier.trim() : (row.supplier as string) || "";
    driver = { id: null, name: "" };
    pompisteContactId = null;
  } else {
    const pompiste = await resolveGasoilContact(
      supabase,
      organizationId,
      body.pompisteContactId !== undefined ? body.pompisteContactId : (row.pompiste_contact_id as string),
      body.supplier ?? (row.supplier as string) ?? "",
    );
    driver = await resolveGasoilContact(
      supabase,
      organizationId,
      body.driverContactId !== undefined ? body.driverContactId : (row.driver_contact_id as string),
      body.beneficiary ?? (row.beneficiary as string) ?? "",
    );
    supplierName = pompiste.name;
    pompisteContactId = pompiste.id;
  }

  const litresChanged = litres !== oldLitres;
  const hadStockMove = await bonHasStockMovement(supabase, organizationId, bonNumber);

  let appliedUnitPrice = Math.max(0, Number(row.unit_price ?? 0));

  try {
    if (hadStockMove && litresChanged) {
      await reverseGasoilStockForBon(supabase, organizationId, userId, {
        bonType: row.bon_type as GasoilBonType,
        litres: oldLitres,
        projectId: row.project_id as string | null,
        bonNumber,
      });

      const stockResult = await applyGasoilStockForBon(supabase, organizationId, userId, {
        bonType: row.bon_type as GasoilBonType,
        litres,
        projectId,
        deliveryNote: isAchat ? "" : (body.deliveryNote?.trim() ?? (row.delivery_note as string) ?? ""),
        supplier: supplierName,
        beneficiary: driver.name,
        bonNumber,
        bonDate,
        unitPricePerLitre:
          isAchat && body.unitPricePerLitre != null && body.unitPricePerLitre > 0
            ? body.unitPricePerLitre
            : undefined,
      });

      if (isAchat) {
        appliedUnitPrice =
          body.unitPricePerLitre != null && body.unitPricePerLitre > 0
            ? body.unitPricePerLitre
            : stockResult?.unitPricePerLitre ?? appliedUnitPrice;
      } else {
        appliedUnitPrice =
          appliedUnitPrice > 0 ? appliedUnitPrice : (stockResult?.unitPricePerLitre ?? 0);
      }
    } else if (isAchat && body.unitPricePerLitre != null && body.unitPricePerLitre > 0) {
      appliedUnitPrice = body.unitPricePerLitre;
    }

    if (body.unitPricePerLitre != null && body.unitPricePerLitre > 0) {
      appliedUnitPrice = body.unitPricePerLitre;
    }
  } catch (e) {
    if (hadStockMove && litresChanged) {
      try {
        await applyGasoilStockForBon(supabase, organizationId, userId, {
          bonType: row.bon_type as GasoilBonType,
          litres: oldLitres,
          projectId: row.project_id as string | undefined,
          supplier: (row.supplier as string) || "",
          beneficiary: (row.beneficiary as string) || "",
          bonNumber,
          bonDate: row.bon_date as string,
        });
      } catch {
        /* best effort rollback */
      }
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mise à jour stock impossible" },
      { status: 400 },
    );
  }

  const priceFields =
    appliedUnitPrice > 0
      ? gasoilBonPriceFields(litres, appliedUnitPrice)
      : { unit_price: Number(row.unit_price ?? 0), total_amount: Number(row.total_amount ?? 0) };

  const { data, error } = await supabase
    .from("admin_gasoil_bons")
    .update({
      vehicle_category: vehicleCategory,
      project_id: project.project_id,
      material_id: isAchat ? null : material.material_id,
      equipment_id: isAchat ? null : body.equipmentId ?? (row.equipment_id as string | null),
      vehicle_label: vehicleLabel,
      equipment_name: equipmentName,
      site_name: project.site_name,
      bon_date: bonDate,
      litres,
      pump_meter: pumpMeter,
      supplier: supplierName,
      beneficiary: driver.name,
      driver_contact_id: driver.id,
      pompiste_contact_id: pompisteContactId,
      fuel_time: isAchat ? "" : (body.fuelTime?.trim() ?? (row.fuel_time as string) ?? ""),
      delivery_note: isAchat ? "" : (body.deliveryNote?.trim() ?? (row.delivery_note as string) ?? ""),
      notes: body.notes !== undefined ? body.notes.trim() : (row.notes as string) || "",
      ...priceFields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapRow(data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { data: row, error: loadErr } = await supabase
    .from("admin_gasoil_bons")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Bon introuvable" }, { status: 404 });

  const bonNumber = row.number as string;
  const { data: stockMoves } = await supabase
    .from("admin_stock_movements")
    .select("id")
    .eq("organization_id", organizationId)
    .or(`delivery_note.eq.${bonNumber},notes.ilike.%${bonNumber}%`)
    .limit(1);

  if ((stockMoves?.length ?? 0) > 0) {
    try {
      await reverseGasoilStockForBon(supabase, organizationId, userId, {
        bonType: row.bon_type as GasoilBonType,
        litres: Number(row.litres ?? 0),
        projectId: row.project_id as string | null,
        bonNumber,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Annulation stock impossible" },
        { status: 400 },
      );
    }
  }

  await deleteFuelEntryForBon(
    supabase,
    organizationId,
    id,
    (row.fuel_entry_id as string) || null,
  );

  const { error } = await supabase
    .from("admin_gasoil_bons")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
