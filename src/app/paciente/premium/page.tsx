import type { Metadata } from "next";
import { PatientPremiumPage } from "@/features/newsroom/patient-premium-page";

export const metadata: Metadata = { title: "Contenido premium" };

export default function PremiumPatientRoute() {
  return <PatientPremiumPage />;
}
