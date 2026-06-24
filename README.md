# Corazón Migrante – Frontend

Este repositorio contiene el **frontend oficial de la plataforma Corazón Migrante**, desarrollado con **React + Vite**. El objetivo principal del frontend es ofrecer una experiencia clara, accesible y emocionalmente cuidada para personas migrantes y sus familias.

La aplicación se encarga de la **interfaz pública**, la navegación, los formularios y la comunicación con los servicios del backend.

---

## 🧱 Tecnologías utilizadas

- **React** – Construcción de interfaces de usuario
- **Vite** – Entorno de desarrollo y build de alto rendimiento
- **JavaScript (ESM)** – Módulos modernos
- **ESLint** – Control de calidad y consistencia del código

---

## 📁 Estructura del proyecto

```text
src/
├── assets/            # Imágenes, íconos y recursos estáticos
├── components/        # Componentes reutilizables
├── modules/           # Módulos funcionales (landing, auth, vistas públicas, etc.)
├── hooks/             # Custom hooks
├── services/          # Comunicación con APIs
├── helpers/           # Utilidades compartidas
└── main.jsx           # Punto de entrada de la aplicación
```

Archivos principales en la raíz:
- `index.html`
- `vite.config.js`
- `package.json`
- `eslint.config.js`
- `.gitignore`

---

## ▶️ Ejecución en entorno de desarrollo

Instalar dependencias:

```bash
npm install
```

Levantar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en:

```
http://localhost:5173
```

---

## 🏗️ Build para producción

Para generar la versión optimizada de producción:

```bash
npm run build
```

El resultado se genera en la carpeta `dist/`, la cual **no se versiona** en el repositorio.

---

## 🔐 Variables de entorno

Las variables de entorno no se suben al repositorio.

Debe utilizarse un archivo `.env` local basado en:

```
.env.example
```

---

## 🎯 Enfoque del proyecto

El frontend de **Corazón Migrante** está diseñado con un enfoque humano y social, priorizando:

- Claridad visual y accesibilidad
- Buen rendimiento y tiempos de carga
- Código modular y mantenible
- Escalabilidad a largo plazo

---

## 📌 Notas finales

Este frontend está pensado para integrarse directamente con el backend del proyecto Corazón Migrante. Cualquier modificación debe respetar la estructura y las convenciones definidas en el proyecto.

