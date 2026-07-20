import { ProfileCard } from "@/features/dashboard/profile-card";
import { ProfilePhotoUploader, TherapistProfileForm } from "@/features/profile/profile-forms";
import { PageHeader } from "@/shared/ui/page-header";

export default function TherapistProfilePage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Perfil profesional" description="Actualiza tu información profesional visible para pacientes y tu foto de perfil." />
      <ProfileCard />
      <ProfilePhotoUploader />
      <TherapistProfileForm />
    </div>
  );
}
