import { HeartHandshake, MapPin, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

export const landingSections = {
  values: [
    {
      icon: HeartHandshake,
      title: "Acompañamiento humano",
      description: "Diseñado para personas que atraviesan procesos de migración y necesitan sentirse escuchadas con respeto."
    },
    {
      icon: ShieldCheck,
      title: "Privacidad y cuidado",
      description: "La experiencia prioriza el manejo responsable de datos personales y la claridad en cada interacción."
    },
    {
      icon: UsersRound,
      title: "Red profesional",
      description: "Terapeutas y equipo administrativo trabajan con flujos separados, seguros y bien organizados."
    }
  ],
  steps: ["Elige el motivo de consulta", "Consulta disponibilidad real", "Solicita o confirma tu cita", "Recibe seguimiento desde tu portal"],
  impact: [
    { label: "Atención", value: "Cercana" },
    { label: "Experiencia", value: "Segura" },
    { label: "Gestión", value: "Ordenada" }
  ],
  specialists: [
    { name: "Equipo clínico", focus: "Acompañamiento emocional", location: "Atención remota" },
    { name: "Orientación familiar", focus: "Adaptación y vínculos", location: "Según disponibilidad" },
    { name: "Apoyo migrante", focus: "Proceso de cambio", location: "Modalidad flexible" }
  ],
  icons: { Sparkles, MapPin }
};
