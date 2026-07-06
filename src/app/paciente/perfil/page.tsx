import { ProfileCard } from "@/features/dashboard/profile-card";
import { PatientProfileForm, ProfilePhotoUploader } from "@/features/profile/profile-forms";
import { PageHeader } from "@/shared/ui/page-header";

export default function PatientProfilePage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Perfil" description="Consulta y actualiza tus datos de paciente, incluida tu foto de perfil." />
      <ProfileCard />
      <ProfilePhotoUploader />
      <PatientProfileForm />
    </div>
  );
}
