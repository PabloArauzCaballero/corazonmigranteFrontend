# Deploy en Cloudflare Pages

Configuración recomendada para este frontend Next.js como sitio estático:

- Framework preset: `Next.js (Static HTML Export)`
- Build command: `yarn build`
- Build output directory: `out`
- Root directory: raíz del repo frontend
- Node version: `22.16.0` o compatible con el `engines` del proyecto

Notas:

- Este proyecto usa `output: "export"`, por eso `next build` genera la carpeta `out`.
- No uses `dist` como output directory en Cloudflare Pages.
- `.yarnrc.yml` fuerza `nodeLinker: node-modules` para evitar problemas de Yarn PnP con ESLint/Next en Cloudflare.
- Si se despliega como sitio estático, `middleware.ts` no protege rutas en el edge. La protección visible queda en los guards del cliente y la seguridad real debe estar en el backend.
