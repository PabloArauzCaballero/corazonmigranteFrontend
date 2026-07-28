import type { TourStep } from "@/features/tutorial/guided-tour";
import { ADMIN_TOUR, PATIENT_TOUR } from "@/features/tutorial/tutorial-launcher";

/**
 * Tutoriales interactivos POR PANTALLA para los portales admin y paciente.
 * Cada ruta tiene su propio recorrido contextual; el launcher (en DashboardShell)
 * elige el de la página actual y lo auto-inicia una vez por pantalla.
 *
 * Selectores robustos disponibles en la mayoría de páginas: `main h1` (título),
 * `main form` (formulario de alta), `main table` (tabla/listado). Si un target no
 * existe en la página, el paso se centra igualmente mostrando la explicación.
 */

const center = (title: string, body: string): TourStep => ({ placement: "center", title, body });
const heading = (title: string, body: string): TourStep => ({ target: "main h1", placement: "bottom", title, body });
const form = (title: string, body: string): TourStep => ({ target: "main form", placement: "bottom", title, body });
const table = (title: string, body: string): TourStep => ({ target: "main table", placement: "top", title, body });

// ── Portal administrativo ──────────────────────────────────────────
const ADMIN_ROUTE_TOURS: Record<string, TourStep[]> = {
  "/admin": ADMIN_TOUR, // el inicio usa el recorrido general del menú
  "/admin/notificaciones": [
    center("Notificaciones", "Aquí llegan los eventos del sistema: nuevas citas, cambios de estado y registros de usuarios."),
    heading("Filtra y marca como leído", "Cambia entre «Todas» y «Solo no leídas», y usa «Marcar todo como leído» para ponerte al día."),
  ],
  "/admin/solicitudes": [
    center("Citas de pacientes", "Las solicitudes de cita que envían los pacientes. Desde aquí las confirmas o las gestionas."),
    table("Gestiona cada solicitud", "Cada fila muestra el estado; usa las acciones para confirmar. Verás una confirmación al actuar."),
  ],
  "/admin/booking": [
    center("Agendar cita", "Crea una cita en nombre de un paciente eligiendo terapeuta y disponibilidad real del sistema."),
    form("Datos de la cita", "Completa el paciente, el terapeuta y el horario. La disponibilidad se consulta al servidor."),
  ],
  "/admin/usuarios": [
    center("Personas registradas", "Administra las cuentas de pacientes, terapeutas y personal del centro."),
    heading("Busca y filtra", "Usa la búsqueda para encontrar una persona; desde la tabla puedes ver y editar su cuenta."),
    table("Listado de usuarios", "Cada fila permite gestionar rol, estado y datos de la persona."),
  ],
  "/admin/descargables": [
    center("Descargables", "Guías, PDFs y recursos con control de visibilidad (público, premium, compra), versiones y métricas."),
    heading("Métricas y nuevo recurso", "Arriba ves totales, publicados, premium, Hotmart y descargas. Con «Nuevo descargable» creas uno."),
    table("Tus descargables", "Publica versiones inmutables, revisa el historial de versiones y vincula productos de Hotmart."),
  ],
  "/admin/publicidad/empresas": [
    center("Empresas anunciantes", "Registra las empresas que muestran publicidad: su nombre, contacto y logo."),
    form("Registrar empresa", "Completa razón social, nombre comercial y contacto. El logo es opcional y se sube a Cloudinary."),
    table("Lista de empresas", "Verás el logo, el contacto y el estado de cada empresa registrada."),
  ],
  "/admin/publicidad/ubicaciones": [
    center("Ubicaciones de anuncios", "Un mapa visual de dónde pueden aparecer los anuncios en el sitio."),
    heading("Recuadros activos", "Los recuadros resaltados están activos; los grises están desactivados o sin configurar."),
  ],
  "/admin/publicidad/campanas": [
    center("Campañas publicitarias", "Agrupan los anuncios de una empresa durante un periodo y eligen dónde se muestran."),
    form("Crear campaña", "Elige empresa, fechas, ubicaciones y las publicaciones o páginas donde aparecerá. Los selectores tienen búsqueda con chips."),
    table("Gestiona las campañas", "Cada fila muestra el estado; usa Activar/Pausar con iconos y recibirás una confirmación de la acción."),
  ],
  "/admin/publicidad/creativos": [
    center("Creativos", "Las piezas gráficas (banners) asociadas a cada campaña."),
    form("Nuevo creativo", "Sube la imagen o pega una URL pública, define el destino y la ubicación donde se mostrará."),
    table("Piezas por campaña", "Revisa el estado de aprobación y cuál es la pieza principal de cada campaña."),
  ],
  "/admin/contenido/publicaciones": [
    center("Publicaciones", "Crea, edita y publica el contenido editorial: noticias, columnas y artículos."),
    form("Redacta la publicación", "Completa título, resumen, cuerpo, portada, categoría y etiquetas. Elige en qué páginas aparecerá."),
    table("Tus publicaciones", "Guarda como borrador, envía a revisión, publica o archiva desde el listado."),
  ],
  "/admin/contenido/publico": [
    center("Noticias y columnas", "La vista pública del contenido editorial que ven los usuarios finales."),
    table("Publicaciones públicas", "Revisa cómo se listan las noticias y columnas ya publicadas."),
  ],
  "/admin/contenido/suscriptores": [
    center("Suscriptores premium", "Gestiona el acceso premium: aprueba o rechaza las solicitudes que envían los usuarios."),
    heading("Solicitudes pendientes", "El panel superior muestra las solicitudes premium por aprobar o rechazar; abajo, los suscriptores actuales."),
  ],
  "/admin/contenido/paginas": [
    center("Páginas del sitio", "Administra las páginas públicas y su contenido editable desde el CMS."),
    table("Listado de páginas", "Crea y edita las páginas que consume el sitio público."),
  ],
  "/admin/contenido/categorias": [
    center("Categorías", "Organiza el contenido editorial en categorías para navegarlo mejor."),
    form("Nueva categoría", "Define nombre y slug; se usa para agrupar y filtrar publicaciones."),
  ],
  "/admin/contenido/tags": [
    center("Etiquetas", "Etiquetas para clasificar publicaciones de forma transversal."),
    form("Nueva etiqueta", "Crea etiquetas reutilizables para tus publicaciones."),
  ],
  "/admin/contenido/autores": [
    center("Autores", "Los autores que firman el contenido editorial."),
    form("Nuevo autor", "Registra nombre, titular y biografía del autor."),
  ],
  "/admin/contenido/homepage": [
    center("Portada del sitio", "Controla las secciones y elementos destacados de la página de inicio pública."),
  ],
  "/admin/archivos": [
    center("Archivos y medios", "Gestiona los archivos e imágenes de la plataforma, alojados en Cloudinary."),
    heading("Sube y administra", "Sube archivos, copia su enlace público y revisa sus metadatos."),
  ],
  "/admin/contabilidad": [
    center("Contabilidad", "El control del dinero del sistema: cuentas, movimientos y ventas. Solo personal autorizado."),
    heading("Secciones contables", "Cuentas, grupos de cuenta, centros de costo y transacciones/ventas registradas."),
  ],
  "/admin/productos/servicios": [
    center("Servicios", "Los servicios terapéuticos que ofrece el centro y su configuración."),
    form("Nuevo servicio", "Define el servicio, su enfoque y detalles para el catálogo."),
  ],
  "/admin/productos/enfoques": [
    center("Enfoques terapéuticos", "Los enfoques que sustentan los servicios ofrecidos."),
    form("Nuevo enfoque", "Registra un enfoque terapéutico con su descripción."),
  ],
};

// ── Portal del paciente ────────────────────────────────────────────
const PATIENT_ROUTE_TOURS: Record<string, TourStep[]> = {
  "/paciente": PATIENT_TOUR, // el inicio usa el recorrido general del menú
  "/paciente/citas": [
    center("Mis citas", "Aquí ves el estado de tus citas: próximas, confirmadas y su historial."),
    heading("Sigue tu proceso", "Revisa fechas, modalidad y el estado de cada cita en un solo lugar."),
  ],
  "/paciente/booking": [
    center("Reservar cita", "Solicita una nueva cita eligiendo la disponibilidad de forma clara y sin presión."),
    form("Elige tu horario", "Selecciona el tipo de sesión y un horario disponible; el sistema confirma la disponibilidad real."),
  ],
  "/paciente/premium": [
    center("Contenido premium", "Recursos exclusivos para suscriptores. Si aún no tienes acceso, puedes solicitarlo aquí."),
    heading("Solicita tu acceso", "Envía tu solicitud premium; el equipo la revisará y te dará acceso al contenido exclusivo."),
  ],
  "/paciente/descargables": [
    center("Mis descargables", "Guías y materiales que puedes consultar y descargar cuando los necesites."),
    heading("Descarga tus recursos", "Cada recurso abre su enlace seguro; el contenido premium requiere tu suscripción activa."),
  ],
  "/paciente/perfil": [
    center("Tu perfil", "Actualiza tus datos y preferencias. Tu información se trata con cuidado y privacidad."),
    form("Edita tus datos", "Mantén tu información al día para un mejor acompañamiento."),
  ],
};

/** Devuelve el tour de la ruta actual (o el más específico que coincida). */
export function getRouteTour(pathname: string): { steps: TourStep[]; key: string } | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const isAdmin = clean === "/admin" || clean.startsWith("/admin/");
  const table = isAdmin ? ADMIN_ROUTE_TOURS : PATIENT_ROUTE_TOURS;
  // Coincidencia por ruta más específica (más larga) que sea prefijo del pathname.
  const match = Object.keys(table)
    .filter((route) => clean === route || clean.startsWith(route + "/"))
    .sort((a, b) => b.length - a.length)[0];
  if (!match) {
    // Sin tour específico: usa el recorrido general del portal.
    if (isAdmin) return { steps: ADMIN_TOUR, key: "cm.tour.admin.v1" };
    if (clean === "/paciente" || clean.startsWith("/paciente/")) return { steps: PATIENT_TOUR, key: "cm.tour.paciente.v1" };
    return null;
  }
  return { steps: table[match], key: `cm.tour.route.${match}.v2` };
}
