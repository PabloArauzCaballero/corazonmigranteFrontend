import type { AdminUser } from "@/features/users/users.types";

export const demoUsers: AdminUser[] = [
  { id: "u-1", name: "Paciente Demo", email: "paciente@demo.local", role: "PACIENTE", status: "activo" },
  { id: "u-2", name: "Terapeuta Demo", email: "terapeuta@demo.local", role: "TERAPEUTA", status: "activo" },
  { id: "u-3", name: "Administrador Demo", email: "admin@demo.local", role: "ADMIN", status: "activo" }
];
