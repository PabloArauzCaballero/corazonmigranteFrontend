"use client";

import { ArrowRight, BookOpen, Lightbulb, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Artículos editoriales de la Biblioteca (serie "Duelo migratorio").
 * Contenido de largo formato con imagen de portada y lectura completa en modal.
 */
type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "help"; text: string };

export type Article = {
  id: string;
  eyebrow: string;
  title: string;
  image: string;
  excerpt: string;
  readingTime: string;
  blocks: Block[];
};

export const ARTICLES: Article[] = [
  {
    id: "que-es-el-duelo-migratorio",
    eyebrow: "Artículo pilar",
    title: "¿Qué es el duelo migratorio? Las siete pérdidas que nadie te explicó al emigrar",
    image: "/articulos/duelo-que-es.png",
    excerpt:
      "Migrar suele presentarse como una decisión llena de esperanza. Pero detrás de cada proceso existe una experiencia silenciosa y profunda: el duelo migratorio.",
    readingTime: "8 min de lectura",
    blocks: [
      { type: "quote", text: "Pensé que lo difícil sería aprender otro idioma. No imaginé que lo verdaderamente difícil sería dejar de escuchar la voz de mi madre cada domingo. Pensé que extrañaría la comida, pero terminé extrañando cosas que nunca imaginé: el olor de la lluvia sobre mi calle, las bromas que solo entendían mis amigos, o la sensación de pertenecer a algún lugar." },
      { type: "p", text: "Migrar suele presentarse como una decisión llena de esperanza. En las fotografías aparecen aeropuertos, maletas y sonrisas. En las redes sociales predominan los nuevos paisajes, los logros profesionales y las historias de éxito." },
      { type: "p", text: "Sin embargo, detrás de cada proceso migratorio existe una experiencia mucho más silenciosa y profunda: el duelo migratorio. No se trata únicamente de cambiar de país. Se trata de reorganizar la propia identidad mientras se aprende a vivir lejos de aquello que durante años definió quiénes somos." },
      { type: "p", text: "A diferencia de otros duelos, este rara vez recibe reconocimiento social. Nadie organiza un funeral cuando una persona emigra. Nadie concede licencia laboral para llorar la distancia. Incluso el propio migrante suele sentirse culpable por sufrir, porque fue él quien decidió partir. Y, sin embargo, el dolor existe." },
      { type: "p", text: "Comprender el duelo migratorio no significa verlo como una enfermedad. Significa reconocer que toda migración implica pérdidas, adaptaciones y reconstrucciones. Cuando este proceso es comprendido y acompañado, puede convertirse en una oportunidad de crecimiento. Cuando permanece invisibilizado, aumenta el riesgo de ansiedad, depresión, aislamiento e incluso del llamado Síndrome de Ulises, descrito por el psiquiatra español Dr. Joseba Achotegui." },
      { type: "h2", text: "¿Qué es el duelo migratorio?" },
      { type: "p", text: "Una de las mayores equivocaciones es pensar que migrar consiste únicamente en cambiar de país. En realidad, migrar significa cambiar de vida. Implica dejar atrás personas, lugares, costumbres, proyectos, formas de relacionarse e incluso partes de la propia identidad para comenzar de nuevo en un entorno desconocido." },
      { type: "p", text: "Cada despedida, aunque haya sido elegida libremente, representa una pérdida. Y toda pérdida necesita ser elaborada. A este proceso psicológico se lo conoce como duelo migratorio." },
      { type: "p", text: "El Dr. Joseba Achotegui, uno de los mayores referentes internacionales en salud mental y migración, lo define como el proceso de adaptación emocional que vive una persona al enfrentarse a las múltiples pérdidas que implica emigrar. No se trata de un único duelo, sino de un conjunto de duelos que ocurren simultáneamente y que afectan diferentes áreas de la vida." },
      { type: "p", text: "A diferencia del duelo por la muerte de un ser querido, la persona no pierde completamente aquello que ama: su familia sigue existiendo, su país continúa allí, sus amigos continúan con sus vidas. Sin embargo, ya no puede acceder a ellos de la misma manera. Por eso muchas personas describen una sensación difícil de explicar: es como sentir nostalgia de una vida que continúa, pero de la que ya no forman parte." },
      { type: "h2", text: "Un duelo que casi nadie ve" },
      { type: "p", text: "Existe otra característica que hace especialmente complejo este proceso: suele ser un duelo invisible. Cuando fallece un ser querido, la sociedad comprende el dolor. Cuando alguien migra, ocurre lo contrario. Las personas suelen escuchar frases como “tú elegiste irte”, “deberías estar feliz”, “al menos ganas más dinero” o “no te quejes”." },
      { type: "p", text: "Aunque muchas veces se dicen con buena intención, pueden provocar que el migrante se sienta incomprendido e incluso culpable por experimentar tristeza. Como consecuencia, muchas personas esconden su sufrimiento: publican fotografías sonriendo mientras, al terminar el día, lloran en silencio frente a la pantalla del teléfono después de hablar con su familia." },
      { type: "p", text: "En consulta no es raro escuchar: “No entiendo qué me pasa. Tengo trabajo, tengo estabilidad, pero siento que algo dentro de mí se rompió.” En realidad, no se ha roto. Está atravesando un duelo. Y ponerle nombre a ese proceso suele ser el primer paso para comenzar a comprenderlo." },
      { type: "h2", text: "Un duelo diferente a todos los demás" },
      { type: "p", text: "1. Es un duelo parcial. El objeto amado no desaparece: la familia sigue viviendo en el país de origen, la casa continúa allí, la lengua materna permanece intacta. Todo sigue existiendo… pero ahora está lejos. La persona sabe que aquello que ama existe, pero no puede acceder a ello cuando lo necesita." },
      { type: "p", text: "2. Es un duelo recurrente. No termina una vez que la persona se adapta. Puede reactivarse cuando nace un sobrino al que no podrá abrazar, cuando fallece un familiar y no logra despedirse, o cuando huele una comida que le recuerda la cocina de su madre. El duelo migratorio tiene memoria." },
      { type: "p", text: "3. Es un duelo múltiple. Quien migra experimenta muchas pérdidas al mismo tiempo. No pierde solamente un lugar: pierde múltiples referencias que sostenían su identidad. Por eso el Dr. Achotegui habla de las siete pérdidas fundamentales del migrante." },
      { type: "help", text: "Sentir tristeza, nostalgia, confusión o miedo después de migrar no significa que hayas tomado una mala decisión. Significa que eres un ser humano intentando adaptarse a una de las experiencias más complejas que puede vivir una persona. Reconocer ese proceso no es una señal de debilidad: es el comienzo del cuidado de la salud mental." },
      { type: "p", text: "Poner nombre a ese proceso es uno de los mayores actos de autocuidado. Porque cuando comprendemos lo que nos ocurre dejamos de luchar contra nuestras emociones y comenzamos a escucharlas. El duelo migratorio no desaparece de un día para otro, pero puede transformarse en una oportunidad para integrar nuestra historia y construir nuevas raíces." },
    ],
  },
  {
    id: "las-siete-perdidas-del-migrante",
    eyebrow: "Serie duelo migratorio",
    title: "Las siete pérdidas del migrante: comprender lo que duele para empezar a sanar",
    image: "/articulos/duelo-siete-perdidas.png",
    excerpt:
      "Migrar implica despedirse de aspectos que durante años dieron sentido a nuestra vida. El Dr. Joseba Achotegui describe siete grandes pérdidas que componen el duelo migratorio.",
    readingTime: "12 min de lectura",
    blocks: [
      { type: "p", text: "Migrar implica mucho más que cambiar de país. Significa despedirse, de manera consciente o inconsciente, de aspectos que durante años dieron sentido a nuestra vida cotidiana y contribuyeron a construir nuestra identidad." },
      { type: "p", text: "El Dr. Joseba Achotegui explica que toda persona migrante atraviesa un proceso de duelo compuesto por siete grandes pérdidas. No deben entenderse como acontecimientos negativos en sí mismos, sino como experiencias inherentes al hecho de comenzar una nueva vida lejos del lugar de origen. Reconocerlas no busca aumentar el dolor, sino darle un nombre." },
      { type: "h2", text: "1. La pérdida de la familia y de los seres queridos" },
      { type: "quote", text: "No me dolió hacer la maleta. Me dolió cerrar la puerta de la casa sabiendo que ya nada volvería a ser igual." },
      { type: "p", text: "La familia suele ser el primer refugio emocional del ser humano. Cuando una persona migra, ese sistema de apoyo queda a miles de kilómetros. Las videollamadas acortan las distancias, pero no reemplazan un abrazo o la posibilidad de acudir a un ser querido cuando las cosas no van bien. Con frecuencia aparece la culpa por no estar presente y la impotencia de no poder regresar con facilidad." },
      { type: "help", text: "¿Qué puede ayudar? Aceptar que mantener el vínculo no siempre significa estar físicamente presente. Crear rituales, programar llamadas significativas y expresar afecto de forma intencional ayuda a preservar el sentido de pertenencia." },
      { type: "h2", text: "2. La pérdida de la lengua materna" },
      { type: "p", text: "Hablar un idioma es mucho más que comunicarse: es la manera en que pensamos, hacemos humor y damos sentido a nuestras experiencias. Muchas personas describen la frustración de sentirse inteligentes en su lengua materna y torpes al intentar expresarse en otro idioma. No poder explicar un síntoma al médico o defender una idea en una reunión puede generar inseguridad y aislamiento." },
      { type: "help", text: "¿Qué puede ayudar? Mantener vivo el idioma materno a través de la lectura y las conversaciones familiares y, al mismo tiempo, permitirse aprender la nueva lengua sin sentir que se traiciona la propia identidad. Aprender un idioma no significa abandonar otro; significa ampliar la forma de habitar el mundo." },
      { type: "h2", text: "3. La pérdida de la cultura" },
      { type: "p", text: "La cultura está presente en cientos de detalles: la forma de saludar, los horarios para comer, el humor compartido, las celebraciones. Al migrar, muchas de esas referencias desaparecen de un día para otro. En ocasiones, el migrante siente que vive entre dos mundos: ya no se identifica completamente con la cultura de origen, pero tampoco termina de sentirse parte de la nueva." },
      { type: "help", text: "¿Qué puede ayudar? Mantener algunas tradiciones del país de origen mientras se exploran con curiosidad las costumbres del nuevo entorno. La integración no implica renunciar a la propia historia, sino permitir que ambas culturas dialoguen y enriquezcan la identidad personal." },
      { type: "p", text: "Quizá, mientras lees estas líneas, hayas descubierto que tu tristeza no se debe únicamente a extrañar un lugar. Y eso cansa. No porque seas débil, sino porque emigrar exige un enorme trabajo emocional que muchas veces pasa desapercibido." },
      { type: "h2", text: "4. La pérdida de la tierra" },
      { type: "quote", text: "Nunca imaginé que extrañaría tanto el olor de la lluvia sobre mi ciudad." },
      { type: "p", text: "La tierra representa mucho más que un territorio: es el clima al que nuestro cuerpo estaba acostumbrado, el paisaje que acompañó nuestra infancia, los aromas de una panadería del barrio. Con frecuencia esta pérdida se intensifica en fechas especiales, cuando el migrante descubre que las estaciones, los horarios e incluso la manera de celebrar son diferentes." },
      { type: "help", text: "¿Qué puede ayudar? Crear nuevos rituales sin abandonar los antiguos: cocinar recetas familiares, escuchar música del país de origen o compartir la propia cultura con personas del país de acogida." },
      { type: "h2", text: "5. La pérdida del estatus social" },
      { type: "quote", text: "En mi país era ingeniero. Aquí limpio oficinas." },
      { type: "p", text: "Es una de las pérdidas menos visibles y más dolorosas. Muchas personas migran dejando atrás años de estudio y reconocimiento social, y al llegar descubren que sus títulos no son homologados. No hay deshonra en ningún trabajo digno; el sufrimiento aparece cuando la persona siente que su identidad profesional ha desaparecido. Esto puede afectar profundamente la autoestima." },
      { type: "help", text: "¿Qué puede ayudar? Recordar que el trabajo actual no define el valor de la persona. Buscar formación, homologación de títulos y redes profesionales ayuda a recuperar el sentido de competencia y esperanza." },
      { type: "h2", text: "6. La pérdida del grupo de pertenencia" },
      { type: "quote", text: "Nunca me había sentido tan rodeado de gente y tan solo al mismo tiempo." },
      { type: "p", text: "El ser humano necesita pertenecer. Cuando migramos, gran parte de esa red desaparece. La soledad puede convertirse en una de las experiencias más intensas de la migración, y no hablamos únicamente de estar físicamente solo: es posible vivir rodeado de personas y, aun así, sentir que nadie conoce realmente nuestra historia." },
      { type: "help", text: "¿Qué puede ayudar? Buscar espacios donde compartir intereses comunes, participar en actividades comunitarias, realizar voluntariado o integrarse en asociaciones de migrantes. No se trata de reemplazar a quienes quedaron atrás, sino de ampliar el círculo de pertenencia." },
      { type: "h2", text: "7. La pérdida de la seguridad" },
      { type: "quote", text: "Por primera vez en mi vida sentí que todo podía cambiar de un día para otro." },
      { type: "p", text: "La seguridad también implica sentir que el futuro es relativamente predecible. Al migrar, muchas certezas desaparecen: ¿podré renovar mi permiso de residencia?, ¿encontraré trabajo?, ¿qué ocurrirá si enfermo? La incertidumbre constante exige un enorme esfuerzo psicológico y ese estrés sostenido puede favorecer ansiedad, insomnio e irritabilidad. No significa que la persona sea frágil." },
      { type: "help", text: "¿Qué puede ayudar? Buscar información confiable, construir una red de apoyo, mantener hábitos de autocuidado y pedir ayuda profesional cuando el miedo comienza a ocupar todos los espacios de la vida." },
      { type: "h2", text: "Una mirada integradora" },
      { type: "p", text: "Migrar no consiste únicamente en cambiar de domicilio: transforma la relación con la familia, la lengua, la cultura, la tierra, la profesión, las amistades y la sensación de seguridad. La buena noticia es que el duelo no es el final de la historia. Con el tiempo, muchas personas descubren que es posible construir nuevas raíces sin renunciar a las anteriores. La identidad no se divide entre el país de origen y el de acogida; se expande." },
      { type: "p", text: "Sanar no consiste en olvidar el lugar del que vienes. Consiste en descubrir que el corazón humano tiene la capacidad de conservar sus raíces mientras aprende a florecer en una tierra nueva." },
    ],
  },
  {
    id: "que-emociones-son-normales",
    eyebrow: "Serie duelo migratorio",
    title: "¿Qué emociones son normales durante el duelo migratorio?",
    image: "/articulos/duelo-emociones.png",
    excerpt:
      "“¿Será normal sentirme así?” Muchas de las emociones difíciles tras migrar forman parte del proceso natural de adaptación. Conocerlas ayuda a comprenderlas.",
    readingTime: "9 min de lectura",
    blocks: [
      { type: "p", text: "Una de las preguntas más frecuentes en consulta es: “¿Será normal sentirme así?”. Muchas personas migrantes llegan preocupadas porque experimentan tristeza, ansiedad, culpa o una profunda sensación de no pertenecer a ningún lugar. La buena noticia es que muchas de estas emociones forman parte del proceso natural de adaptación que acompaña al duelo migratorio." },
      { type: "h2", text: "La nostalgia" },
      { type: "p", text: "Suele ser una de las primeras emociones que aparecen. No siempre se trata de extrañar un lugar físico; muchas veces se extraña una versión de uno mismo, cuando conocía las reglas del entorno y sentía que pertenecía naturalmente a un lugar. La nostalgia no es un enemigo: es la forma en que el corazón recuerda aquello que fue importante." },
      { type: "h2", text: "La tristeza" },
      { type: "p", text: "Toda pérdida genera tristeza, y el duelo migratorio implica muchas pérdidas al mismo tiempo. Llorar no significa que la decisión de migrar haya sido un error; significa que una parte importante de la vida quedó atrás y necesita ser elaborada. La tristeza se vuelve preocupante únicamente cuando se mantiene de forma intensa durante un largo período o se acompaña de desesperanza profunda." },
      { type: "h2", text: "La culpa" },
      { type: "p", text: "Adopta muchas formas: culpa por haber dejado solos a los padres, por no estar presente en el crecimiento de los sobrinos, o por haber logrado una mejor calidad de vida. También existe la culpa inversa: la de quienes sienten que no aprovechan suficientemente la oportunidad. La culpa suele surgir del amor, pero cuando se instala de manera permanente puede impedir disfrutar del presente." },
      { type: "h2", text: "La ansiedad" },
      { type: "p", text: "Migrar implica enfrentarse continuamente a situaciones desconocidas: buscar empleo, aprender nuevas normas, hablar otro idioma. Es natural que el organismo responda con cierto nivel de ansiedad. Se convierte en aliada cuando nos ayuda a prepararnos; sin embargo, cuando permanece activada durante meses sin descanso, puede generar insomnio, irritabilidad, tensión muscular o ataques de pánico." },
      { type: "h2", text: "La sensación de no pertenecer" },
      { type: "p", text: "Muchos migrantes lo describen así: “Ya no soy completamente de aquí, pero tampoco siento que siga siendo completamente de allá.” Esa sensación de vivir entre dos mundos puede generar incertidumbre, pero también representa una oportunidad para construir una identidad más amplia, capaz de integrar distintas culturas sin renunciar a ninguna." },
      { type: "h2", text: "La esperanza" },
      { type: "p", text: "Aunque solemos hablar del duelo desde el dolor, también existe la esperanza: la que impulsa a aprender un nuevo idioma, enviar el primer currículum o comenzar un proyecto que parecía imposible. No elimina las pérdidas: convive con ellas. Sostener el pasado mientras se crea un nuevo proyecto de vida es una de las expresiones más profundas de la resiliencia humana." },
      { type: "help", text: "Detente un momento… Mientras lees este artículo, pregúntate con cuál de estas emociones te identificas hoy. No para etiquetarte, sino para comprenderte. A veces, el primer paso para sanar no es dejar de sentir, sino descubrir que aquello que sentimos tiene un nombre y que muchas otras personas también lo han experimentado." },
      { type: "p", text: "Sentir emociones intensas después de migrar no significa que seas débil. Significa que estás viviendo una experiencia profundamente humana. Con el tiempo, muchas personas descubren que no dejaron de extrañar su país: simplemente aprendieron a vivir llevando dos hogares dentro del corazón." },
    ],
  },
];

function ArticleBlock({ block }: { block: Block }) {
  if (block.type === "h2") {
    return <h3 className="mt-8 font-serif text-2xl font-bold text-slate-950">{block.text}</h3>;
  }
  if (block.type === "quote") {
    return (
      <blockquote className="my-6 border-l-4 border-primary bg-primary/5 px-5 py-4 font-serif text-lg italic leading-8 text-slate-800">
        {block.text}
      </blockquote>
    );
  }
  if (block.type === "help") {
    return (
      <div className="my-6 flex gap-3 rounded-2xl border border-primary/20 bg-[#fbf3f0] p-5">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-[15px] leading-7 text-slate-700">{block.text}</p>
      </div>
    );
  }
  return <p className="mt-4 text-[15px] leading-8 text-slate-700">{block.text}</p>;
}

function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
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
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 md:p-8" role="dialog" aria-modal="true" aria-label={article.title}>
      <div className="absolute inset-0 bg-[#140806]/70" onClick={onClose} aria-hidden="true" />
      <article className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
        <div className="relative h-64 w-full overflow-hidden bg-slate-100 sm:h-80">
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140806] via-[#140806]/35 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar artículo"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 transition hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">{article.eyebrow} · {article.readingTime}</p>
            <h2 className="mt-2 font-serif text-2xl font-bold leading-tight md:text-3xl">{article.title}</h2>
          </div>
        </div>
        <div className="max-h-[55vh] overflow-y-auto px-6 py-7 md:px-10">
          {article.blocks.map((block, i) => (
            <ArticleBlock key={i} block={block} />
          ))}
        </div>
      </article>
    </div>
  );
}

export function ArticlesGrid({ articles = ARTICLES }: { articles?: Article[] }) {
  const [active, setActive] = useState<Article | null>(null);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => setActive(article)}
            className="group flex flex-col overflow-hidden border border-slate-200 bg-white text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
          >
            <div className="relative h-52 overflow-hidden bg-slate-100">
              <img
                src={article.image}
                alt={article.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary backdrop-blur">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {article.eyebrow}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-serif text-lg font-bold leading-snug text-slate-950">{article.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{article.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                Leer artículo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </button>
        ))}
      </div>
      {active ? <ArticleModal article={active} onClose={() => setActive(null)} /> : null}
    </>
  );
}
