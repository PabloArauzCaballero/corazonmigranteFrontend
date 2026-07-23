import { ArrowUpRight, GraduationCap } from "lucide-react";

/**
 * Cursos de la Biblioteca con enlace directo a Hotmart.
 *
 * Cómo agregar un curso: añade un objeto a `COURSES` con
 *  - title:       Nombre del curso
 *  - description: Breve descripción
 *  - image:       URL de la imagen (Cloudinary, Hotmart o cualquier URL pública)
 *  - hotmartUrl:  Link del producto en Hotmart (se abre en una pestaña nueva)
 *  - badge:       (opcional) etiqueta corta, p. ej. "Curso online"
 */
export type Course = {
  id: string;
  title: string;
  description: string;
  image: string;
  hotmartUrl: string;
  badge?: string;
};

const CLOUD_BASE =
  "https://res.cloudinary.com/sfyimi9x/image/upload/corazon-migrante/landing_page/media";

// Seeds de ejemplo — reemplaza título/descripcion/imagen/hotmartUrl por los reales.
export const COURSES: Course[] = [
  {
    id: "duelo-migratorio",
    title: "Duelo migratorio: reconstruir sin perderte",
    description:
      "Un curso guiado para entender y transitar las pérdidas de migrar: la casa, los vínculos y la identidad.",
    image: `${CLOUD_BASE}/carrusel-3.webp`,
    hotmartUrl: "https://hotmart.com/es",
    badge: "Curso online",
  },
  {
    id: "ansiedad-y-adaptacion",
    title: "Ansiedad y adaptación en un país nuevo",
    description:
      "Herramientas prácticas para calmar el modo alerta y recuperar seguridad mientras te adaptas.",
    image: `${CLOUD_BASE}/carrusel-6.webp`,
    hotmartUrl: "https://hotmart.com/es",
    badge: "Curso online",
  },
  {
    id: "familia-a-distancia",
    title: "Sostener a la familia a distancia",
    description:
      "Cómo cuidar los vínculos con quienes se quedaron sin cargar con toda la culpa.",
    image: `${CLOUD_BASE}/carrusel-1.webp`,
    hotmartUrl: "https://hotmart.com/es",
    badge: "Curso online",
  },
];

export function CoursesGrid({ courses = COURSES }: { courses?: Course[] }) {
  if (courses.length === 0) {
    return (
      <div className="border border-slate-200 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-slate-900">
          Pronto abriremos nuevos cursos
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Estamos preparando formaciones para acompañar tu proceso paso a paso.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <a
          key={course.id}
          href={course.hotmartUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col overflow-hidden border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
        >
          <div className="relative h-48 overflow-hidden bg-slate-100">
            <img
              src={course.image}
              alt={course.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            {course.badge ? (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary backdrop-blur">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                {course.badge}
              </span>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h3 className="font-serif text-xl font-bold leading-snug text-slate-950">
              {course.title}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
              {course.description}
            </p>
            <span className="mt-5 inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-bold text-white transition group-hover:bg-[#5f0a0a]">
              Ver en Hotmart
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
