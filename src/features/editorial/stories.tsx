"use client";

import { ArrowRight, Quote, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Historias reales de personas migrantes (seeds de publicaciones).
 *
 * Para agregar una historia añade un objeto a `MIGRANT_STORIES` con
 *  - name:       Nombre de la persona
 *  - meta:       Edad y nacionalidad, p. ej. "47 años · Venezolana"
 *  - title:      Título/frase de la historia
 *  - image:      URL de la imagen
 *  - paragraphs: Relato completo, un string por párrafo
 */
export type Story = {
  id: string;
  name: string;
  meta: string;
  title: string;
  image: string;
  paragraphs: string[];
};

const CLOUD_BASE =
  "https://res.cloudinary.com/sfyimi9x/image/upload/corazon-migrante/landing_page/media";

export const MIGRANT_STORIES: Story[] = [
  {
    id: "maria",
    name: "María",
    meta: "47 años · Venezolana",
    title: "Trabajar para que otros vivan",
    image: `${CLOUD_BASE}/testimonio-maria.webp`,
    paragraphs: [
      "María se despierta a las 4:50 de la mañana. No usa alarma. El cuerpo ya aprendió.",
      "En la pieza que alquila hay una cama, una maleta que nunca desarmó del todo y una foto pegada con cinta en la pared: sus dos hijos, adolescentes, todavía en Venezuela. A veces les habla antes de salir, como si pudieran escucharla desde ahí.",
      "Trabaja limpiando casas. Tres por día. En cada una es “la señora que ayuda”, nunca María. Cobra por horas, sin contrato, sin seguro. Sabe exactamente cuántos minutos puede tardar en cada tarea porque el cansancio no es negociable: si se enferma, no cobra. Si no cobra, no manda plata. Si no manda plata, falla.",
      "María no llora casi nunca. No porque no duela, sino porque no hay tiempo emocional para hacerlo. Extraña cosas mínimas: el olor del café, el ruido del ventilador, discutir con sus hijos por tonterías. No extraña el país. Extraña la vida que tenía dentro de él.",
      "Su mayor miedo no es quedarse acá para siempre. Es que sus hijos crezcan sin necesitarla. Migrar, para María, no fue una elección. Fue una estrategia de supervivencia emocional: sacrificar presencia para garantizar futuro.",
    ],
  },
  {
    id: "jose",
    name: "José",
    meta: "29 años · Boliviano",
    title: "El que se volvió adulto lejos",
    image: `${CLOUD_BASE}/testimonio-jose.webp`,
    paragraphs: [
      "José llegó solo. Con una mochila y un número de contacto que nunca respondió. Al principio dormía en un cuarto compartido con otros cinco migrantes. Todos hombres. Todos cansados. Todos callados. Ahí aprendió que el silencio también es un idioma. Trabaja en construcción. Jornadas largas, manos rotas, espalda rígida. No se queja. En su cabeza, quejarse es un lujo.",
      "Extraña a su madre, pero no se lo dice. No quiere preocuparla. José se volvió adulto lejos. Aprendió a pagar alquiler, a cocinar lo justo, a no confiar rápido. Lo que no aprendió fue a descansar.",
      "Tiene ataques de ansiedad que no sabe nombrar: palpitaciones, sudor frío, pensamientos repetitivos. Cree que es cansancio. Nadie le enseñó que el cuerpo también protesta. A veces se pregunta quién sería si se hubiera quedado. No por arrepentimiento. Por curiosidad.",
      "Migrar lo hizo fuerte, sí. Pero también lo dejó solo en decisiones que nadie debería tomar tan joven.",
    ],
  },
  {
    id: "lucia",
    name: "Lucía",
    meta: "34 años · Argentina",
    title: "Buscando el éxito",
    image: `${CLOUD_BASE}/testimonio-lucia.webp`,
    paragraphs: [
      "En redes, Lucía sonríe. Buen trabajo, buen departamento, buena vida. La realidad es menos estética. Trabaja en marketing. Idioma aprendido a fuerza de vergüenza. Sonríe incluso cuando no entiende todo. Vive con miedo a que descubran que todavía se siente afuera.",
      "Lucía no extraña su país. Extraña sentirse cómoda. En reuniones sociales se ríe un segundo tarde. Piensa las frases antes de decirlas. Se cansa más de lo que admite. El esfuerzo constante de adaptarse desgasta. Tiene una culpa silenciosa: “Me va bien… ¿por qué me siento mal?”",
      "Migrar, en su caso, no fue precariedad económica, fue desarraigo identitario. Cuando todo funciona, pero nada se siente propio. La psicología lo diría simple: pérdida de referencia emocional. Lucía lo vive así: no saber dónde descansar la cabeza.",
    ],
  },
  {
    id: "pedro",
    name: "Pedro",
    meta: "52 años · Peruano",
    title: "El que nunca volvió",
    image: `${CLOUD_BASE}/testimonio-pedro.webp`,
    paragraphs: [
      "Pedro dijo “voy un año”. Van quince. Trabaja en gastronomía. Siempre de pie. Siempre tarde. Siempre cansado. Mandó plata durante años. Ayudó a todos. Se olvidó de sí.",
      "Sus hijos crecieron. No lo culpan, pero tampoco lo necesitan igual. Pedro siente que llegó tarde a su propia vida. Cuando piensa en volver, ya no sabe a dónde.",
      "La casa ya no es suya. El barrio cambió. Él también. Migrar le dio dignidad económica. Le quitó tiempo irrecuperable. Hay una tristeza particular en quienes sostuvieron todo… y se quedaron sin nada propio.",
    ],
  },
  {
    id: "ana",
    name: "Ana",
    meta: "23 años · Colombiana",
    title: "La que no sabe si quedarse o irse",
    image: `${CLOUD_BASE}/testimonio-ana.webp`,
    paragraphs: [
      "Ana migra con el celular en la mano. Todo lo compara. Todo lo duda. Estudia, trabaja medio tiempo, vive cansada pero esperanzada. Todavía cree que todo puede mejorar.",
      "Tiene miedo de fallar. De quedarse. De volver. La ansiedad la acompaña como ruido de fondo. No es pánico. Es incertidumbre constante. Ana representa al migrante joven moderno: informado, conectado, pero emocionalmente saturado.",
      "Demasiadas opciones. Demasiadas decisiones. Migrar, para ella, no es huida ni sacrificio total. Es búsqueda. Y aun así, duele.",
    ],
  },
];

function StoryModal({ story, onClose }: { story: Story; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 md:p-8" role="dialog" aria-modal="true" aria-label={`Historia de ${story.name}`}>
      <div className="absolute inset-0 bg-[#140806]/70" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
        <div className="relative h-64 w-full overflow-hidden bg-slate-100 sm:h-80">
          <img src={story.image} alt={story.name} className="h-full w-full object-cover object-[center_20%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140806] via-[#140806]/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar historia"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 transition hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">{story.meta}</p>
            <h3 className="mt-1 font-serif text-3xl font-bold">{story.name}</h3>
            <p className="mt-1 font-serif text-lg italic text-white/85">“{story.title}”</p>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-6 py-7 md:px-9">
          {story.paragraphs.map((p, i) => (
            <p key={i} className="mb-4 text-[15px] leading-8 text-slate-700 last:mb-0">
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoriesGrid({ stories = MIGRANT_STORIES }: { stories?: Story[] }) {
  const [active, setActive] = useState<Story | null>(null);

  if (stories.length === 0) {
    return (
      <div className="border border-slate-200 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-slate-900">Pronto compartiremos nuevas historias</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => setActive(story)}
            className="group flex flex-col overflow-hidden border border-slate-200 bg-white text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
          >
            <div className="relative h-56 overflow-hidden bg-slate-100">
              <img
                src={story.image}
                alt={story.name}
                loading="lazy"
                className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140806]/85 via-[#140806]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">{story.meta}</p>
                <p className="font-serif text-xl font-bold">{story.name}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <Quote className="h-5 w-5 text-primary/40" aria-hidden="true" />
              <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-slate-950">“{story.title}”</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                {story.paragraphs[0].slice(0, 130)}…
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                Leer historia <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </button>
        ))}
      </div>
      {active ? <StoryModal story={active} onClose={() => setActive(null)} /> : null}
    </>
  );
}
