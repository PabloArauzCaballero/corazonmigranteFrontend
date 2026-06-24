# Documentación Técnica - Frontend Corazón Migrante

## 1. Visión General
Este documento detalla la arquitectura técnica, estructura de módulos y flujos principales del frontend de la plataforma Corazón Migrante. El proyecto está construido sobre un stack moderno de React + Vite.

## 2. Stack Tecnológico
- **Core**: React 18+ (Hooks, Functional Components)
- **Build Tool**: Vite (Rápido HMR y bundling optimizado)
- **Estilos**: Tailwind CSS 3 (Utility-first CSS)
- **Router**: React Router DOM (v6+)
- **Linter**: ESLint

## 3. Estructura del Proyecto (`src/`)

### 3.1 `app/` (Core)
Contiene la configuración central y el punto de entrada de la aplicación.
- **`main.jsx`**: Punto de entrada (mounting) de la aplicación React.
- **`App.jsx`**: Componente raíz que envuelve la aplicación.
- **`routes/AppRouter.jsx`**: Definición central de rutas y navegación. Gestiona la lógica de qué componente mostrar según la URL.
- **`routes/AdminLayout.jsx`**: Layout base para el panel de administración, incluyendo sidebar y header comunes.
- **`routes/AdminLoginRoute.jsx`**: Componente de protección de rutas (Route Guard) que verifica si hay sesión activa antes de permitir el acceso.

### 3.2 `modules/` (Lógica de Negocio)
La aplicación está organizada modularmente por dominios de negocio:

- **`auth/`**: Gestión de sesión y autenticación.
    - `AdminLogin.jsx`: Formulario de inicio de sesión para administradores y terapeutas.
- **`contabilidad/`**: Módulo financiero.
    - Gestión de cuentas y movimientos contables.
- **`productos/`**: Gestión de inventario/tienda.
    - `ProductosDashboard.jsx`: Panel principal de productos.
- **`sistema/`**: Administración del sistema.
    - Gestión de usuarios y roles (`UsersDashboard`, `UsersTable`).
    - Configuraciones globales.
- **`terapia/`**: Gestión clínica y de terapeutas.
    - Expedientes, citas y perfiles de terapeutas.
- **`vistas_publicas/`**: Sección pública accesible a usuarios no autenticados.
    - `LandingHome.jsx`: Página de inicio.
    - Componentes de UI pública (secciones informativas, contacto).

### 3.3 `helpers/` y `config/`
- **`helpers/api_conn_factory.js`**: **Crítico**. Utilidad central para realizar todas las peticiones HTTP (Fetch wrapper). Estandariza el manejo de headers, tokens de autenticación y errores de respuesta.
- **`config/`**: Archivos de constantes y configuración.
    - `API_URL.js`: Define la URL base del backend.
    - `USUARIOS_ENDPOINTS.js`, `TERAPIA_ENDPOINTS.js`, etc.: Centralizan las rutas de los endpoints de la API para mantener el código limpio.

## 4. Flujos Clave

### Autenticación
El sistema utiliza un mecanismo de login centralizado en `AdminLogin.jsx`.
1. El usuario ingresa credenciales.
2. Se envía petición al backend vía `api_conn_factory`.
3. Si es exitoso, se establece la sesión (token/cookie).
4. `AdminLoginRoute.jsx` protege las rutas privadas verificando este estado.

### Routing
El enrutamiento (`src/app/routes/AppRouter.jsx`) separa claramente:
- **Rutas Públicas**: Accesibles por cualquiera (ej. Landing Page).
- **Rutas Privadas**: Requieren autenticación (ej. `/admin`, `/terapeuta`). Usan `AdminLayout` para mantener consistencia visual.

## 5. Scripts de Desarrollo

Estos comandos se ejecutan desde la raíz de `frontend/`:

- **`npm run dev`**:  
  Inicia el servidor de desarrollo local (Vite) en `http://localhost:5173` (por defecto). Soporta Hot Module Replacement (HMR).

- **`npm run build`**:  
  Genera la versión de producción optimizada en la carpeta `dist/`. Minifica código y activos para mejor rendimiento.

- **`npm run lint`**:  
  Ejecuta ESLint para analizar el código en busca de errores estáticos y problemas de estilo.

## 6. Mantenimiento y Limpieza
- **Console Logs**: Se ha realizado una limpieza exhaustiva de `console.log` en el código de producción.
- **Recomendación**: Para depuración futura, utilice herramientas de debugger del navegador o logs controlados que sean eliminados antes del despliegue final.
