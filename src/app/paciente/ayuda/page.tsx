import type { Metadata } from "next";
import { TutorialCenter } from "@/features/tutorial/ui/tutorial-center";

export const metadata: Metadata = {
  title: "Centro de ayuda",
  robots: { index: false, follow: false },
};

export default function PatientHelpCenterPage() {
  return (
    <TutorialCenter
      title="Centro de tutoriales"
      description="Recorridos cortos y guiados sobre tu portal. Puedes repetirlos las veces que quieras, a tu ritmo."
    />
  );
}
