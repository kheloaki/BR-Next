import heroIndustrial from "@/assets/hero-industrial.jpg";
import baraneLogoFooterTransparent from "@/assets/barane-logo-footer-transparent.png";
import baraneLogoHorizontalTransparent from "@/assets/barane-logo-horizontal-transparent.png";
import catMotors from "@/assets/cat-motors.jpg";
import catBearings from "@/assets/cat-bearings.jpg";
import catScreening from "@/assets/cat-screening.jpg";
import catHydraulic from "@/assets/cat-hydraulic.jpg";
import sectorMining from "@/assets/sector-mining.jpg";
import sectorConstruction from "@/assets/sector-construction.jpg";
import sectorInfrastructure from "@/assets/sector-infrastructure.jpg";
import sectorLogistics from "@/assets/sector-logistics.jpg";
import sectorEquipment from "@/assets/sector-equipment.jpg";

/** Same pattern as Vite: bundled asset URLs (matches original TanStack app). */
export const siteImages = {
  hero: heroIndustrial.src,
  logoHeader: baraneLogoHorizontalTransparent.src,
  logoFooter: baraneLogoFooterTransparent.src,
  catMotors: catMotors.src,
  catBearings: catBearings.src,
  catScreening: catScreening.src,
  catHydraulic: catHydraulic.src,
  sectorMining: sectorMining.src,
  sectorConstruction: sectorConstruction.src,
  sectorInfrastructure: sectorInfrastructure.src,
  sectorLogistics: sectorLogistics.src,
  sectorEquipment: sectorEquipment.src,
} as const;
