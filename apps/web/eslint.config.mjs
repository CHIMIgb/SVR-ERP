import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Estas 11 páginas cargan datos al montar con useEffect. Sustituirlo por una
// caché de datos es un cambio de arquitectura ajeno a este corte; la excepción
// se limita a esos archivos, no a todo el proyecto.
const paginasConCargaInicial = [
  "src/app/(dashboard)/clientes/page.tsx",
  "src/app/(dashboard)/configuracion/page.tsx",
  "src/app/(dashboard)/cotizaciones/page.tsx",
  "src/app/(dashboard)/criba/page.tsx",
  "src/app/(dashboard)/equipos/page.tsx",
  "src/app/(dashboard)/inventario/page.tsx",
  "src/app/(dashboard)/operaciones/page.tsx",
  "src/app/(dashboard)/proyectos/page.tsx",
  "src/app/(dashboard)/roles/page.tsx",
  "src/app/(dashboard)/usuarios/page.tsx",
  "src/app/(dashboard)/ventas/cierres/page.tsx",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: paginasConCargaInicial,
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
