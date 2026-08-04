import type { Metadata } from "next";
import { TutorialCenter } from "@/features/tutorial/ui/tutorial-center";

export const metadata: Metadata = {
  title: "Centro de ayuda",
  robots: { index: false, follow: false },
};

export default function AdminHelpCenterPage() {
  return (
    <TutorialCenter
      title="Centro de tutoriales"
      description="Recorridos guiados sobre el panel real. Solo aparecen los módulos a los que tu cuenta tiene acceso."
    />
  );
}
