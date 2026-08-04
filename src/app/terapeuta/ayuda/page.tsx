import type { Metadata } from "next";
import { TutorialCenter } from "@/features/tutorial/ui/tutorial-center";

export const metadata: Metadata = {
  title: "Centro de ayuda",
  robots: { index: false, follow: false },
};

export default function TherapistHelpCenterPage() {
  return (
    <TutorialCenter
      title="Centro de tutoriales"
      description="Recorridos guiados sobre tu portal profesional: agenda, horarios y perfil."
    />
  );
}
