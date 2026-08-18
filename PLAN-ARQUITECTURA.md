# PLAN DE IMPLEMENTACION: Arquitectura SVR-ERP

## Resumen del Cambio

El proyecto tiene problemas criticos de arquitectura (data.ts monolitico, cero code splitting, 39/41 archivos client-side) que causan errores FATAL de Turbopack. Ademas, el proyecto se migrara a **React Native con Expo**.

### Orden de ejecucion

```
Fase 1  →  Fase 2  →  Fase 3 (MIGRACION)  →  Fase 4 (UI en RN)
 10 min    1-2 hrs      dias-semanas            semanas
```

**Por que este orden:**
- **Fase 1** (limpieza): rapido, sin riesgo, reduce ruido inmediato
- **Fase 2** (dividir data.ts): los tipos y datos son **agnosticos a la plataforma** - sirven tal cual en React Native
- **Fase 3** (migracion): el foco principal del proyecto
- **Fase 4** (UI en RN): se rehace la interfaz con componentes nativos (FlatList, StyleSheet, Navigation)

**Lo que NO se migra del proyecto web (se rehace en RN):**
- Todo Tailwind CSS / estilos web
- Componentes UI (Modal, WorkerCard, etc.) - se rehacen con View/Text/StyleSheet
- Context providers - se reemplazan con Expo Router o React Navigation
- Keyframes CSS - se reemplazan con Animated o react-native-reanimated
- PageHeader, SearchInput, StatsCard (Fase 2 original) - se rehacen en RN

**Lo que SI se reutiliza directamente:**
- Todas las interfaces TypeScript (Maquina, Trabajador, Proyecto, etc.)
- Todos los datos mock
- Logica de negocio (formatCurrency, calculos de nomina, etc.)
- Estructura de navegacion (24 pantallas mapean a screens)

---

## FASE 1: Limpieza de dependencias muertas y config obsoleta

> *Impacto: Inmediato. Sin riesgo. Desbloquea estabilidad de Turbopack.*

### Archivos Afectados

```
[ELIMINAR] tailwind.config.ts
  - Archivo obsoleto: Tailwind v4 ignora este archivo completamente
  - Los tokens ya estan definidos correctamente en globals.css via @theme {}
  - Turbopack aun resolve este archivo en el grafo de modulos sin usarlo

[MODIFICAR] package.json
  - Eliminar "framer-motion": "^12.38.0" de dependencies
  - Confirmado: 0 imports en todo el codigo fuente
  - Paquete pesado (~300KB+) que Turbopack analiza innecesariamente
```

### Orden de Ejecucion

1. Eliminar `tailwind.config.ts`
2. Eliminar `framer-motion` de `package.json`
3. Ejecutar `npm install` para actualizar lockfile
4. Verificar que `npm run dev` funciona y las vistas se siguen renderizando correctamente

### Impacto

- **Turbopack:** Reduce el grafo de modulos que debe resolver
- **Velocidad:** `npm install` sera mas rapido sin framer-motion
- **Riesgo:** Nulo - ninguno de estos archivos se usa en codigo fuente

---

## FASE 2: Dividir el monolito `data.ts`

> *Impacto: Prepara los tipos y datos para la migracion a React Native. Los tipos son agnosticos a la plataforma y se reutilizan directamente.*

### Archivos Afectados

```
[CREAR] src/types/index.ts
  - Re-exportar todos los tipos desde archivos de dominio
  - Contenido: export * from './maquinaria'
  - Contenido: export * from './trabajadores'
  - Contenido: export * from './proyectos'
  - etc.
  - ~15 lineas

[CREAR] src/types/maquinaria.ts
  - Interface Maquina (lineas 1-126 de data.ts)
  - Interface ChecklistPreoperacional (lineas 624-691)
  - Interface DespachoMaquina (lineas 1235-1267)
  - ~100 lineas

[CREAR] src/types/trabajadores.ts
  - Type CategoriaPuesto (linea 127)
  - Interface Permiso (lineas 129-138)
  - Interface Trabajador (lineas 139-171)
  - Interface BitacoraRentaDiaria (lineas 172-199)
  - Interface HorasExtraDetalle (lineas 692-703)
  - Interface RegistroAsistencia (lineas 704-731)
  - Interface DiaAsistenciaSemana (lineas 732-743)
  - Interface AsistenciaSemanalTrabajador (lineas 744-754)
  - ~130 lineas

[CREAR] src/types/proyectos.ts
  - Interface HitoProgreso (lineas 452-457)
  - Interface Proyecto (lineas 458-558)
  - Interface APUItem (lineas 1168-1174)
  - Interface APUTemplate (lineas 1175-1234)
  - ~120 lineas

[CREAR] src/types/operaciones.ts
  - Interface CargaCombustible (lineas 559-623)
  - Interface ArticuloInventario (lineas 942-958)
  - Interface RegistroMantenimiento (lineas 959-974)
  - Interface Cliente (lineas 975-988)
  - Interface Cotizacion (lineas 989-1002)
  - Interface Transaccion (lineas 1003-1017)
  - Interface Documento (lineas 1018-1048)
  - Interface Incidente (lineas 1049-1064)
  - Interface Bitacora (lineas 1065-1078)
  - Interface LecturaHorometro (lineas 1079-1093)
  - Interface ReporteCampo (lineas 1094-1167)
  - Interface RegistroCriba (lineas 1268-1286)
  - ~200 lineas

[CREAR] src/lib/mock-data/maquinaria.ts
  - Export array maquinaria (lineas 28-126)
  - Export array checklistsPreoperacionales (lineas 641-691)
  - Export array despachosFlota (lineas 1243-1267)
  - ~200 lineas

[CREAR] src/lib/mock-data/trabajadores.ts
  - Export array trabajadores (lineas 283-451)
  - Export array bitacorasRentaData (lineas 200-282)
  - Export array registrosAsistencia (lineas 755-870)
  - Export array asistenciaSemanalData (lineas 871-941)
  - ~500 lineas

[CREAR] src/lib/mock-data/proyectos.ts
  - Export array proyectos (lineas 480-558)
  - ~80 lineas

[CREAR] src/lib/mock-data/operaciones.ts
  - Export array cargasCombustible (lineas 576-640)
  - Export array inventario (lineas 953-958)
  - Export array mantenimiento (lineas 970-974)
  - Export array clientes (lineas 984-988)
  - Export array cotizaciones (lineas 998-1002)
  - Export array finanzas (lineas 1012-1017)
  - Export array documentos (lineas 1029-1048)
  - Export array incidentes (lineas 1060-1064)
  - Export array operaciones (lineas 1074-1078)
  - Export array lecturasHorometro (lineas 1088-1093)
  - Export array reportesCampo (lineas 1108-1167)
  - Export array registrosCriba (lineas 1280-1286)
  - Export array apuTemplates (lineas 1184-1234)
  - ~400 lineas

[MODIFICAR] src/lib/data.ts
  - Reemplazar TODO el contenido por re-exports desde los nuevos modulos
  - Contenido final: ~25 lineas de re-exports
  - Ejemplo:
    export type { Maquina, ChecklistPreoperacional, ... } from '@/types/maquinaria'
    export { maquinaria, checklistsPreoperacionales, ... } from '@/lib/mock-data/maquinaria'
  - Esto mantiene compatibilidad: los 28 archivos que importan de @/lib/data no necesitan cambiar

[MODIFICAR] 28 archivos que importan de @/lib/data (OPCIONAL, fase 2)
  - Despues de verificar que los re-exports funcionan, se pueden actualizar los imports
  - para apuntar directamente a los modulos especificos:
    - import { Maquina } from '@/types/maquinaria'
    - import { maquinaria } from '@/lib/mock-data/maquinaria'
  - Esto mejora el tree-shaking pero NO es urgente
```

### Orden de Ejecucion

1. Crear archivos de tipos (`src/types/*.ts`) - no tienen dependencias
2. Crear archivos de mock data (`src/lib/mock-data/*.ts`) - dependen de tipos
3. Modificar `src/lib/data.ts` para que re-exporte todo
4. Verificar que `npm run dev` funciona sin errores
5. Verificar que todas las vistas siguen renderizando correctamente
6. (Opcional) Actualizar imports en los 28 archivos para apuntar a modulos especificos

### Impacto

- **Turbopack:** Un cambio en `trabajadores` solo re-compila `mock-data/trabajadores.ts` y sus 6 dependientes, no los 28 archivos
- **Granularidad:** El grafo de modulos se divide de 1 nodo gigante a ~8 nodos pequenos
- **Mantenibilidad:** Los tipos estan organizados por dominio, los datos estan separados por entidad

---

## FASE 3: Migrar a React Native con Expo

> *Impacto: Migracion completa de la plataforma web a movil nativo.*

### Stack de la nueva app

```
Runtime:        Expo SDK 52+ (managed workflow)
Navigation:     Expo Router (file-based routing, similar a Next.js App Router)
UI:             React Native StyleSheet + Custom Components
Estado:         Zustand o React Context (ligero)
Datos:          Los mismos types y mock-data de la Fase 2 se copian tal cual
Iconos:         @expo/vector-icons o lucide-react-native
Animaciones:    react-native-reanimated
```

### Estructura del proyecto Expo

```
svr-erp-mobile/
  app/                          # Expo Router (file-based routing)
    _layout.tsx                 # Root layout (providers, font loading)
    index.tsx                   # Login/landing
    (auth)/
      login.tsx
    (dashboard)/
      _layout.tsx               # Dashboard layout (sidebar/drawer + providers)
      dashboard/
        index.tsx               # Panel principal
      asistencia/
        index.tsx
      maquinaria/
        index.tsx
      nomina/
        index.tsx
      trabajadores/
        index.tsx
      ... (24 pantallas, una por dominio)
  components/
    ui/                         # Componentes base reutilizables
      Button.tsx
      Card.tsx
      Input.tsx
      Modal.tsx
      PageHeader.tsx
      SearchInput.tsx
      StatsCard.tsx
      Badge.tsx
      Avatar.tsx
    layout/                     # Layout components
      Sidebar.tsx               # Drawer lateral o bottom tabs
      Topbar.tsx
    workers/                    # Worker domain components
    machinery/                  # Machinery domain components
    projects/                   # Project domain components
  lib/
    utils.ts                    # formatCurrency, formatDate, cn (adaptado para RN)
    colors.ts                   # Paleta de colores (tokens)
    spacing.ts                  # Escala de espaciado
    typography.ts               # Tipografias
  types/                        # Copiados directamente de la Fase 2
    index.ts
    maquinaria.ts
    trabajadores.ts
    proyectos.ts
    operaciones.ts
  data/                         # Copiados directamente de la Fase 2
    mock-data/
      maquinaria.ts
      trabajadores.ts
      proyectos.ts
      operaciones.ts
  assets/                       # Iconos, imagenes, fuentes
    fonts/
    images/
  app.json                      # Configuracion de Expo
  package.json
  tsconfig.json
```

### Mapeo de pantallas web a RN

| Web (Next.js) | React Native (Expo Router) | Notas |
|---------------|---------------------------|-------|
| `(dashboard)/layout.tsx` | `(dashboard)/_layout.tsx` | Drawer o Bottom Tabs en vez de Sidebar |
| `Sidebar.tsx` | `Sidebar.tsx` o `(drawer)` | Expo Router supports drawers |
| `Topbar.tsx` | `Topbar.tsx` o header de pantalla | Header de React Navigation |
| `Modal.tsx` | `Modal.tsx` | `react-native` Modal o custom bottom sheet |
| `Toast.tsx` | `Toast.tsx` | `react-native-reanimated` para animar |
| `page.tsx` (cada vista) | `index.tsx` (cada pantalla) | Mismo nombre de carpeta |
| `WorkerCard.tsx` | `WorkerCard.tsx` | View + StyleSheet en vez de div + Tailwind |
| `MachineCard.tsx` | `MachineCard.tsx` | Igual pero nativo |
| `LiquidacionModal.tsx` | `LiquidacionModal.tsx` | Bottom sheet o Modal nativo |

### Orden de Ejecucion

1. `npx create-expo-app svr-erp-mobile --template tabs` (o blank + Expo Router)
2. Configurar Expo Router, fuentes, y tema de colores
3. Copiar `types/` y `data/` de la Fase 2 sin modificar
4. Crear componentes base (`Button`, `Card`, `Input`, `Modal`)
5. Migrar layout (drawer/navigation + providers)
6. Migrar pantallas de mayor a menor complejidad:
   - Dashboard principal (resumen)
   - Trabajadores (CRUD basico)
   - Asistencia (tablas + GPS)
   - Maquinaria (cards + telemetry)
   - Nomina (calculos + recibos)
   - Resto de pantallas
7. Agregar navegacion completa entre pantallas
8. Testing en Android/iOS (Expo Go o emulador)

### Consideraciones de UI movil

- **No hay sidebar fijo** - usar Bottom Tabs (5 tabs max) o Drawer
- **Las tablas grandes** se convierten en FlatList con scroll vertical
- **Los modales** se convierten en Bottom Sheets o modales nativos
- **El mapa GPS** usa `react-native-maps` en vez de tiles web
- **Los formularios** se adaptan a teclado nativo (KeyboardAvoidingView)
- **Pull-to-refresh** en listas en vez de boton manual
- **Touch targets** minimo 44x44px (WCAG movil)

---

## FASE 4: UI y componentes en React Native

> *Impacto: Construir la interfaz movil completa con componentes nativos reutilizables.*

### Componentes UI base a crear

```
[CREAR] components/ui/Button.tsx
  - Variantes: primary, secondary, outline, ghost, danger
  - Tamanos: sm, md, lg
  - Estados: default, disabled, loading (con ActivityIndicator)
  - Props: title, onPress, variant, size, loading, disabled, icon

[CREAR] components/ui/Card.tsx
  - Contenedor con sombra, border-radius, padding
  - Props: children, style, onPress (opcional)

[CREAR] components/ui/Input.tsx
  - TextInput con label, placeholder, error message
  - Props: label, value, onChangeText, placeholder, error, secureTextEntry

[CREAR] components/ui/Modal.tsx
  - Modal nativo con overlay, titulo, contenido, acciones
  - Alternativa: Bottom Sheet con @gorhom/bottom-sheet

[CREAR] components/ui/PageHeader.tsx
  - Titulo + subtitulo + boton de accion
  - Props: title, subtitle, actionTitle, onAction

[CREAR] components/ui/SearchInput.tsx
  - TextInput con icono de busqueda
  - Props: value, onChangeText, placeholder

[CREAR] components/ui/StatsCard.tsx
  - KPI card con icono, valor, tendencia
  - Props: title, value, icon, trend, color

[CREAR] components/ui/Badge.tsx
  - Etiqueta de estado (activo, inactivo, pendiente, etc.)
  - Props: label, color, size

[CREAR] components/ui/Avatar.tsx
  - Iniciales del usuario o imagen
  - Props: name, imageUrl, size

[CREAR] components/ui/EmptyState.tsx
  - Estado vacio con icono y mensaje
  - Props: icon, title, message, actionTitle, onAction

[CREAR] components/ui/LoadingSpinner.tsx
  - ActivityIndicator centrado con opcion de texto
  - Props: text, size
```

### Tema de colores (tokens)

```typescript
// lib/colors.ts
export const colors = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  primaryLight: '#fbbf24',
  secondary: '#0f172a',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',
}
```

### Orden de Ejecucion

1. Definir tokens de color, spacing, typography
2. Crear componentes base (Button, Card, Input)
3. Crear componentes de layout (PageHeader, SearchInput)
4. Crear componentes de feedback (Modal, Toast, EmptyState, LoadingSpinner)
5. Crear componentes de dominio (WorkerCard, MachineCard, StatsCard)
6. Integrar en las pantallas migradas de la Fase 3
7. Testing visual en Android/iOS

### Impacto

- **Codebase limpio:** Componentes bien separados por responsabilidad
- **Reutilizacion:** Los componentes UI se usan en todas las 24 pantallas
- **Consistencia:** Tokens de diseno centralizados
- **Testing:** Cada componente se puede probar en aislamiento

---

## Resumen de Impacto por Fase

| Fase | Que hace | Que reutiliza | Que se rehace | Tiempo est. |
|------|----------|---------------|---------------|-------------|
| 1 | Limpiar deps muertas | Nada | Nada | 10 min |
| 2 | Dividir data.ts en modulos | Tipos + datos en RN | Nada | 1-2 hrs |
| 3 | Migrar a Expo + Expo Router | Types, data, logica de negocio | Layout, navegacion | dias-semanas |
| 4 | Construir UI nativa | Nada (se rehace con StyleSheet) | Todos los componentes UI | semanas |

### Lo que se transfiere sin cambios

- 27 interfaces TypeScript (Maquina, Trabajador, Proyecto, etc.)
- 21 arrays de datos mock
- Logica de formatCurrency, formatDate
- Calculos de nomina, liquidacion, etc.

### Lo que se rehace en React Native

- 41 archivos de componentes UI (Tailwind -> StyleSheet)
- Layout y navegacion (Next.js App Router -> Expo Router)
- Animaciones (CSS keyframes -> react-native-reanimated)
- Estado global (React Context -> Zustand o Context nativo)

## Verificacion Post-Implementacion

### Fase 1-2 (web):
1. `npm run dev` inicia sin errores
2. Navegar a cada vista funciona correctamente
3. Los errores FATAL de Turbopack ya no aparecen

### Fase 3-4 (React Native):
1. `npx expo start` inicia sin errores
2. Navegar entre pantallas funciona (drawer/tabs)
3. Cada pantalla muestra los datos correctos
4. Modales y sheets se abren/cierran correctamente
5. Pull-to-refresh funciona en listas
6. Teclado no bloquea formularios
7. Testing en Android (Expo Go) y iOS (Simulator)
