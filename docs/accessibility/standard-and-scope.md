# Estándar y alcance de accesibilidad

- **Fecha de evidencia:** 2026-08-03

## 1. Estándar aplicado

**WCAG 2.2, nivel AA.**

No existe un requisito contractual documentado en el repositorio que fije otro estándar. Se adopta WCAG 2.2 AA por ser el criterio de referencia habitual y porque **el propio código ya cita criterios WCAG por su número** (2.2.1 en `toast.tsx`, 1.4.4 en el `viewport` del layout raíz), lo que indica que el equipo ya trabajaba con esa referencia.

## 2. Por qué importa especialmente aquí

Corazón Migrante atiende a **personas migrantes que buscan acompañamiento emocional**. Es una población con mayor probabilidad de:

- usar dispositivos antiguos o de gama baja;
- acceder desde conexiones limitadas;
- tener el navegador o el sistema en otro idioma;
- atravesar situaciones de estrés que reducen la tolerancia a interfaces confusas.

La accesibilidad aquí no es cumplimiento formal: es la diferencia entre poder pedir ayuda o no.

## 3. Alcance de la evaluación

| Incluido | Excluido |
|---|---|
| Layouts y shells (público y de portal) | Contenido cargado desde el CMS (fuera del control del frontend) |
| Los 19 componentes de `shared/ui` | Backend y correos transaccionales |
| Estados de interfaz (carga, vacío, error, prohibido) | Documentos PDF descargables |
| Formularios de autenticación y perfil | Imágenes alojadas en Cloudinary (su texto alternativo sí) |
| Overlay de tutoriales | — |
| Tokens de color y tipografía | — |

## 4. Excepciones registradas

| Excepción | Criterio | Justificación |
|---|---|---|
| Contraste sin verificar | 1.4.3 | Sin herramienta de medición en el repositorio. Registrado como `A11Y-02` |
| `Button size="sm"` a 36 px | 2.5.5 (AAA) | Cumple AA (24 px). No se persigue nivel AAA |
| Sin modo oscuro | — | No es un criterio WCAG. `prefers-color-scheme` no está implementado |
| Contenido del CMS | Varios | El frontend no controla el texto alternativo ni la estructura del contenido editorial |

La última merece atención: si una persona administradora publica una imagen sin texto alternativo desde el CMS, la página resultante incumplirá WCAG 1.1.1 y **el frontend no puede impedirlo**. La mitigación pertenece al flujo editorial, no al código.

## 5. Criterios de aceptación para código nuevo

Antes de dar por terminada una pantalla:

1. Es operable solo con teclado, de principio a fin.
2. El foco es visible en todo control interactivo.
3. Todo `<img>` tiene `alt` (vacío si es decorativa).
4. Todo campo de formulario tiene `<label>` asociado.
5. Los errores se anuncian, no solo se colorean.
6. Existe un `<h1>` y la jerarquía no salta niveles.
7. Ningún elemento superpuesto atrapa el foco sin salida.
8. La información no se transmite solo por color.
9. Toda animación respeta `prefers-reduced-motion`.

Estos nueve puntos son la lista de verificación de [../governance/review-process.md](../governance/review-process.md).
