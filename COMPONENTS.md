# Guia de Componentes UI - SVR-ERP

> Referencia definitiva para todos los componentes reutilizables del sistema SVR-ERP.
> Todos los componentes estan construidos con **Tailwind CSS v4**, **React 19** y **TypeScript**.

---

## Tabla de Contenidos

1. [Fundamentos](#1-fundamentos)
   - [Utilidad cn()](#11-utilidad-cn)
   - [Tokens de Tema](#12-tokens-de-tema)
   - [Iconografia](#13-iconografia)
   - [Patron de Archivos](#14-patron-de-archivos)
2. [Componentes Base](#2-componentes-base)
   - [Button](#21-button)
   - [Card](#22-card)
   - [Input](#23-input)
   - [Select](#24-select)
   - [DatePicker](#25-datepicker)
   - [DateRangePicker](#26-daterangepicker)
   - [FormField](#27-formfield)
   - [Checkbox](#28-checkbox)
   - [Radio](#29-radio)
   - [Switch](#210-switch)
   - [Badge](#211-badge)
3. [Componentes de Layout](#3-componentes-de-layout)
   - [PageHeader](#31-pageheader)
   - [Tabs](#32-tabs)
   - [Grid](#33-grid)
   - [Center](#34-center)
   - [Spacer](#35-spacer)
   - [Flex](#36-flex)
   - [AspectRatio](#37-aspectratio)
   - [VisuallyHidden](#38-visuallyhidden)
   - [Show / Hide](#39-show--hide)
   - [ScrollArea](#310-scrollarea)
   - [Separator](#311-separator)
   - [Box](#312-box)
   - [Collapse](#313-collapse)
   - [Portal](#314-portal)
   - [Overlay](#315-overlay)
   - [Stack](#316-stack)
   - [Container](#317-container)
   - [Divider](#318-divider)
4. [Componentes de Feedback](#4-componentes-de-feedback)
   - [StatsCard](#41-statscard)
   - [EmptyState](#42-emptystate)
   - [LoadingState](#43-loadingstate)
   - [Badge](#44-badge)
   - [Skeleton](#45-skeleton)
   - [SkeletonText](#46-skeletontext)
5. [Componentes de Datos](#5-componentes-de-datos)
   - [DataTable](#51-datatable)
   - [Pagination](#52-pagination)
6. [Componentes de Sistema](#6-componentes-de-sistema)
   - [Modal](#61-modal)
   - [FormModal](#62-formmodal)
   - [ModalField](#63-modalfield)
   - [Toast](#64-toast)
   - [NotificationContext](#65-notificationcontext)
7. [Guia de Estilos](#7-guia-de-estilos)
   - [Patron de Estilos Separados](#71-patron-de-estilos-separados)
   - [Convenciones de Nomenclatura](#72-convenciones-de-nomenclatura)
   - [Responsive Design](#73-responsive-design)
8. [Reglas de Espaciado y Zona Segura](#8-reglas-de-espaciado-y-zona-segura)

---

## 1. Fundamentos

### 1.1 Utilidad cn()

Funcion centralizada para componer clases de Tailwind de forma segura. Combina `clsx` (clases condicionales) con `tailwind-merge` (resuelve conflictos de Tailwind).

**Ubicacion:** `src/lib/utils.ts`

```ts
import { cn } from '@/lib/utils';

// Ejemplo
cn(
  'px-4 py-2',
  isActive && 'bg-primary text-white',
  disabled && 'opacity-50 pointer-events-none',
  className // permite override externo
);
```

**Reglas:**
- Siempre usar `cn()` en vez de concatenar strings de clases manualmente.
- Siempre incluir `className` como ultimo argumento para permitir override.
- Las clases de Tailwind conflictuales se resuelven automaticamente (ej: `px-4` gana sobre `px-2`).

### 1.2 Tokens de Tema

Todos los tokens estan definidos en `src/app/globals.css` dentro del bloque `@theme {}` de Tailwind CSS v4.

> **IMPORTANTE:** `tailwind.config.ts` es codigo muerto de v3. No editarlo ni referenciarlo.

#### Colores de Marca

| Token | Valor CSS | Uso en Tailwind |
|-------|-----------|-----------------|
| `primary` | `#f97316` | `bg-primary`, `text-primary` |
| `primary-dark` | `#ea580c` | `bg-primary-dark`, `hover:bg-primary-dark` |
| `primary-light` | `#fbbf24` | `bg-primary-light`, `text-primary-light` |
| `secondary` | `#0f172a` | `bg-secondary`, `text-secondary` |
| `sidebar` | `#0f172a` | `bg-sidebar` |

#### Colores Semanticos

| Token | Valor | Uso |
|-------|-------|-----|
| `success` | `#22c55e` | Estados exitosos, completados |
| `success-dark` | `#16a34a` | Hover de exito |
| `warning` | `#f59e0b` | Advertencias, pendientes |
| `warning-dark` | `#d97706` | Hover de advertencia |
| `error` | `#ef4444` | Errores, eliminar, peligro |
| `error-dark` | `#dc2626` | Hover de error |
| `info` | `#3b82f6` | Informacion, enlace |
| `info-dark` | `#2563eb` | Hover de informacion |

#### Superficies

| Token | Valor | Uso |
|-------|-------|-----|
| `surface` | `#ffffff` | Fondo principal |
| `surface-alt` | `#f8fafc` | Fondo alternativo |
| `surface-elevated` | `#ffffff` | Superficies elevadas (modales, dropdowns) |

#### Bordes Redondeados

| Token | Valor | Tailwind |
|-------|-------|----------|
| `radius-sm` | `0.375rem` (6px) | `rounded-sm` |
| `radius-md` | `0.5rem` (8px) | `rounded-md` |
| `radius-lg` | `0.75rem` (12px) | `rounded-lg` |
| `radius-xl` | `1rem` (16px) | `rounded-xl` |
| `radius-2xl` | `1.5rem` (24px) | `rounded-2xl` |
| `radius-full` | `9999px` | `rounded-full` |

#### Sombras

| Token | Tailwind | Uso recomendado |
|-------|----------|-----------------|
| `shadow-sm` | `shadow-sm` | Cards en reposo |
| `shadow-md` | `shadow-md` | Cards en hover |
| `shadow-lg` | `shadow-lg` | Elementos elevados |
| `shadow-xl` | `shadow-xl` | Modales |
| `shadow-primary` | `shadow-primary` | Botones primary |
| `shadow-primary-lg` | `shadow-primary-lg` | Botones primary en hover |

#### Tipografia

| Token | Fuente | Tailwind |
|-------|--------|----------|
| `font-sans` | Inter | `font-sans` (default) |
| `font-display` | Space Grotesk | `font-display` |

#### Animaciones

| Token | Keyframe | Tailwind | Duracion |
|-------|----------|----------|----------|
| `fade-in` | `opacity: 0 -> 1` | `animate-fade-in` | 200ms |
| `slide-up` | `translateY(8px) -> 0` | `animate-slide-up` | 300ms |
| `slide-down` | `translateY(-8px) -> 0` | `animate-slide-down` | 300ms |
| `scale-in` | `scale(0.95) -> 1` | `animate-scale-in` | 200ms |

Keyframes adicionales (no en `@theme`, usados con notacion arbitraria):
- `slideInRight` — para toasts: `animate-[slideInRight_0.3s_ease-out]`
- `fadeScaleIn` — para modales: `animate-[fadeScaleIn_0.2s_ease-out]`

### 1.3 Iconografia

Todos los iconos provienen de **lucide-react**. Nunca se usa el import barrel (`import * from 'lucide-react'`).

**Reglas obligatorias:**
- Importar iconos individualmente: `import { Plus, Save } from 'lucide-react'`
- Un solo color: usar `currentColor` (default) o un color explicito via className
- Tamanos consistentes: `size={16}` (sm), `size={18}` (md), `size={24}` (lg)
- Preferir estilo outline/minimalistico (la mayoria de lucide-react ya lo es)

**Ejemplo correcto:**
```tsx
import { Plus, Trash2, Download } from 'lucide-react';

<Button icon={<Plus size={16} />} iconPosition="left">
  Nuevo Registro
</Button>

<Button variant="danger" icon={<Trash2 size={16} />}>
  Eliminar
</Button>
```

**Ejemplo incorrecto:**
```tsx
// NUNCA importar el barrel completo
import * as Icons from 'lucide-react';

// NUNCA usar inline styles para color
<Plus style={{ color: '#f97316' }} />
```

### 1.4 Patron de Archivos

Cada componente UI sigue la misma estructura de archivos:

```
Componente/
  Componente.tsx       # Logica y JSX del componente
  Componente.styles.ts # Objeto de clases de Tailwind (exportado como {Nombre}Classes)
  index.ts             # Re-exports del componente y sus tipos
```

**Estructura de un archivo de estilos:**
```ts
export const buttonClasses = {
  base: 'clases base del componente',
  disabled: 'clases para estado deshabilitado',
  loading: 'clases para estado de carga',
  variants: {
    primary: 'clases de variante primary',
    secondary: 'clases de variante secondary',
    // ...
  },
  sizes: {
    sm: 'clases de tamano pequeno',
    md: 'clases de tamano mediano',
    lg: 'clases de tamano grande',
  },
};
```

**Estructura de un componente:**
```tsx
'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { componenteClasses } from './Componente.styles';

export interface ComponenteProps extends React.HtmlHTMLAttributes<HTMLElement> {
  // Props custom
}

export const Componente = forwardRef<HTMLElement, ComponenteProps>(
  ({ prop1 = 'default', className, children, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(
          componenteClasses.base,
          componenteClasses.variants[prop1],
          className // SIEMPRE al final para permitir override
        )}
        {...props}
      >
        {children}
      </element>
    );
  }
);

Componente.displayName = 'Componente';
```

---

## 2. Componentes Base

### 2.1 Button

Boton reutilizable con multiples variantes, tamanos, estados y soporte para iconos.

**Archivo:** `src/components/ui/Button/Button.tsx`

**Importacion:**
```tsx
import { Button } from '@/components/ui/Button';
import type { ButtonProps } from '@/components/ui/Button';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'success' \| 'warning' \| 'info'` | `'primary'` | Variante visual del boton |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamano del boton |
| `loading` | `boolean` | `false` | Muestra spinner y deshabilita el boton |
| `icon` | `React.ReactNode` | `undefined` | Icono a mostrar junto al texto |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Posicion del icono relativa al texto |
| `fullWidth` | `boolean` | `false` | El boton ocupa todo el ancho disponible |
| `disabled` | `boolean` | `false` | Deshabilita el boton |

Tambien extiende todas las props nativas de `<button>` (`React.ButtonHTMLAttributes<HTMLButtonElement>`).

#### Variantes

| Variante | Descripcion visual |
|----------|-------------------|
| `primary` | Fondo naranja (`bg-primary`), texto blanco, sombra naranja sutil, efecto hover con elevacion |
| `secondary` | Fondo gris claro (`bg-slate-100`), texto gris oscuro |
| `outline` | Sin fondo, borde gris (`border-2 border-slate-200`), texto gris |
| `ghost` | Sin fondo ni borde, texto gris, solo background en hover |
| `danger` | Fondo rojo (`bg-red-500`), texto blanco, sombra roja sutil |
| `success` | Fondo verde (`bg-green-500`), texto blanco — usar para **crear** registros |
| `warning` | Fondo amarillo (`bg-amber-500`), texto blanco — usar para **editar** registros |
| `info` | Fondo azul (`bg-blue-500`), texto blanco — usar para **mostrar** informacion |

#### Tamanos

| Tamano | Altura | Padding horizontal | Texto | Border radius |
|--------|--------|-------------------|-------|---------------|
| `sm` | `h-8` (32px) | `px-3` | `text-xs` | `rounded-lg` |
| `md` | `h-11` (44px) | `px-5` | `text-sm` | `rounded-xl` |
| `lg` | `h-13` (52px) | `px-7` | `text-base` | `rounded-xl` |

#### Ejemplo basico

```tsx
<Button>Guardar</Button>

<Button variant="danger">Eliminar</Button>

<Button loading>Cargando...</Button>
```

#### Ejemplo avanzado

```tsx
import { Plus, Save, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Boton con icono a la izquierda
<Button icon={<Plus size={16} />} iconPosition="left">
  Nuevo Registro
</Button>

// Boton danger con icono
<Button variant="danger" icon={<Trash2 size={16} />}>
  Eliminar Trabajador
</Button>

// Boton full width en un form
<Button fullWidth icon={<Save size={16} />} loading={isSaving}>
  Guardar Cambios
</Button>

// Grupo de botones con acciones
<div className="flex gap-3">
  <Button variant="outline" icon={<Download size={16} />}>
    Exportar
  </Button>
  <Button icon={<Plus size={16} />}>
    Nuevo
  </Button>
</div>
```

#### Cuando usar

- Cualquier accion que el usuario pueda ejecutar (guardar, eliminar, exportar, crear, etc.)
- Acciones secundarias (variant `outline` o `ghost`)
- Acciones destructivas (variant `danger`)

#### No usar cuando

- No usar como enlace — usar `<Link>` de Next.js con estilos de Tailwind directamente.
- No anidar botones dentro de otros botones.
- No usar `variant="primary"` para multiples botones en la misma fila — solo el boton principal debe ser primary.

---

### 2.2 Card

Contenedor base para agrupar contenido con bordes, sombra y padding consistente.

**Archivo:** `src/components/ui/Card/Card.tsx`

**Importacion:**
```tsx
import { Card } from '@/components/ui/Card';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Espaciado interno de la tarjeta |
| `interactive` | `boolean` | `false` | Habilita efecto hover (sombra + borde) y cursor pointer |

Tambien extiende todas las props nativas de `<div>` (`React.HTMLAttributes<HTMLDivElement>`).

#### Variantes de padding

| Padding | Clase Tailwind | Espaciado |
|---------|---------------|-----------|
| `none` | *(sin padding)* | 0 |
| `sm` | `p-4` | 16px |
| `md` | `p-6` | 24px |
| `lg` | `p-8` | 32px |

#### Estados

| Estado | Visual |
|--------|--------|
| Default | Fondo blanco, borde `slate-200`, `shadow-sm` |
| Interactive (hover) | `shadow-md`, borde `slate-300`, cursor pointer |

#### Ejemplo basico

```tsx
<Card>
  <p>Contenido de la tarjeta</p>
</Card>
```

#### Ejemplo avanzado

```tsx
import { Card } from '@/components/ui/Card';
import { Eye, Edit } from 'lucide-react';

// Card interactiva con padding pequeno
<Card interactive padding="sm">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
      <Eye size={20} />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-900">Titulo</p>
      <p className="text-xs text-slate-500">Descripcion</p>
    </div>
  </div>
</Card>

// Card como contenedor de seccion
<Card className="space-y-4">
  <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
    Seccion de Configuracion
  </h2>
  <Input label="Campo" placeholder="Valor" />
  <Button>Guardar</Button>
</Card>
```

#### Cuando usar

- Envolver contenido en secciones de pagina.
- Crear paneles de informacion agrupada.
- Tarjetas de navegacion o resumen (con `interactive`).

#### No usar cuando

- No usar para layouts completos de pagina (usar `<div>` con grid/flex directamente).
- No envolver un `<Card>` dentro de otro `<Card>` con el mismo padding — anidar cards solo cuando es visualmente necesario.

---

### 2.3 Input

Campo de entrada de texto con soporte para label, iconos y mensajes de error.

**Archivo:** `src/components/ui/Input/Input.tsx`

**Importacion:**
```tsx
import { Input } from '@/components/ui/Input';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `label` | `string` | `undefined` | Etiqueta del campo (aparece arriba, uppercase) |
| `error` | `string` | `undefined` | Mensaje de error (cambia borde a rojo) |
| `icon` | `React.ReactNode` | `undefined` | Icono a mostrar dentro del campo |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Posicion del icono |

Tambien extiende todas las props nativas de `<input>` (`React.InputHTMLAttributes<HTMLInputElement>`).

#### Estados

| Estado | Visual |
|--------|--------|
| Default | Fondo `slate-50`, borde `slate-200`, alto `h-11` |
| Focus | Fondo blanco, borde `primary/50`, ring `primary/10` |
| Error | Borde `red-300`, focus borde `red-500`, focus ring `red-100` |
| Disabled | `opacity-50`, `cursor-not-allowed` |

#### Ejemplo basico

```tsx
<Input label="Nombre" placeholder="Escribe tu nombre..." />
```

#### Ejemplo avanzado

```tsx
import { Mail, Phone, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';

// Input con icono a la izquierda
<Input
  label="Correo Electronico"
  placeholder="correo@ejemplo.com"
  icon={<Mail size={16} />}
  iconPosition="left"
  type="email"
/>

// Input con icono a la derecha
<Input
  label="Telefono"
  placeholder="10 digitos"
  icon={<Phone size={16} />}
  iconPosition="right"
/>

// Input con error de validacion
<Input
  label="Contrasena"
  type="password"
  placeholder="Minimo 8 caracteres"
  icon={<Lock size={16} />}
  error="La contrasena debe tener al menos 8 caracteres"
/>

// Input deshabilitado
<Input label="ID de Trabajador" value="TRB-001" disabled />
```

#### Cuando usar

- Campos de texto en formularios (nombre, correo, telefono, password, etc.)
- Campos de busqueda que requieren label visible.
- Cualquier input que necesite validacion visual con errores.

#### No usar cuando

- No usar para busquedas con debounce — usar `SearchBar`.
- No usar para seleccion multiple — usar `Select`.
- No usar sin label a menos que el contexto sea obvio (dentro de un form con placeholder claro).

---

### 2.4 Select

Campo de seleccion desplegable con label, opciones y manejo de errores.

**Archivo:** `src/components/ui/Select/Select.tsx`

**Importacion:**
```tsx
import { Select } from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `label` | `string` | `undefined` | Etiqueta del campo (uppercase) |
| `error` | `string` | `undefined` | Mensaje de error de validacion |
| `options` | `SelectOption[]` | *(requerido)* | Lista de opciones disponibles |
| `placeholder` | `string` | `'Seleccionar...'` | Texto del placeholder por defecto |

Tambien extiende todas las props nativas de `<select>` (`React.SelectHTMLAttributes<HTMLSelectElement>`).

#### Tipo SelectOption

```ts
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

#### Estados

| Estado | Visual |
|--------|--------|
| Default | Fondo `slate-50`, borde `slate-200`, chevron abajo |
| Focus | Fondo blanco, borde `primary/50`, ring `primary/10` |
| Error | Borde `red-300`, focus borde `red-500` |
| Disabled | `opacity-50`, `cursor-not-allowed` |

#### Ejemplo basico

```tsx
<Select
  label="Puesto"
  options={[
    { value: 'operador', label: 'Operador' },
    { value: 'mecanico', label: 'Mecanico' },
    { value: 'supervisor', label: 'Supervisor' },
  ]}
/>
```

#### Ejemplo avanzado

```tsx
import { Select } from '@/components/ui/Select';

// Select con opciones deshabilitadas y placeholder custom
<Select
  label="Maquinaria Asignada"
  placeholder="Seleccionar maquinaria..."
  options={[
    { value: 'M001', label: 'M001 - Excavadora CAT 320' },
    { value: 'M002', label: 'M002 - Bulldozer D6' },
    { value: 'M003', label: 'M003 - Grua Liebherr', disabled: true },
    { value: 'M004', label: 'M004 - Kenworth Volteo' },
  ]}
/>

// Select con error
<Select
  label="Proyecto"
  options={[
    { value: 'p1', label: 'Fraccionamiento Valle Sur' },
    { value: 'p2', label: 'Obra Toluca C2' },
  ]}
  error="Debe seleccionar un proyecto"
/>

// Select deshabilitado
<Select
  label="Estado"
  options={[{ value: 'activo', label: 'Activo' }]}
  disabled
/>
```

#### Cuando usar

- Seleccionar una opcion de una lista predefinida (puesto, proyecto, estado, etc.)
- Formularios con opciones que no necesitan busqueda.
- Cuando el numero de opciones es manageable (menos de ~20).

#### No usar cuando

- No usar para mas de 20 opciones sin busqueda — considerar un combobox o busqueda.
- No usar como substituto de un input de busqueda.
- No usar para seleccion multiple — este componente solo soporta un solo valor.

---

### 2.5 DatePicker

Selector de fecha con calendario desplegable, navegacion por meses y formato `es-MX`.

**Archivo:** `src/components/ui/DatePicker/DatePicker.tsx`

**Importacion:**
```tsx
import { DatePicker } from '@/components/ui/DatePicker';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `value` | `Date \| null` | `undefined` | Fecha seleccionada (controlado) |
| `defaultValue` | `Date \| null` | `null` | Fecha inicial (no controlado) |
| `onChange` | `(date: Date \| null) => void` | `undefined` | Callback al seleccionar o limpiar |
| `label` | `string` | `undefined` | Etiqueta del campo |
| `placeholder` | `string` | `'Seleccionar fecha'` | Placeholder del input |
| `error` | `string` | `undefined` | Mensaje de error |
| `disabled` | `boolean` | `false` | Deshabilitar el campo |
| `min` | `Date` | `undefined` | Fecha minima seleccionable |
| `max` | `Date` | `undefined` | Fecha maxima seleccionable |
| `disabledDates` | `(date: Date) => boolean` | `undefined` | Funcion para deshabilitar fechas especificas |

#### Ejemplo basico

```tsx
import { DatePicker } from '@/components/ui/DatePicker';
import { useState } from 'react';

function FormularioServicio() {
  const [fecha, setFecha] = useState<Date | null>(new Date());

  return (
    <DatePicker
      value={fecha}
      onChange={setFecha}
      label="Fecha de servicio"
      placeholder="Seleccionar fecha"
    />
  );
}
```

#### Ejemplo con restricciones

```tsx
<DatePicker
  label="Fecha de entrega"
  min={new Date()}
  max={new Date(2025, 11, 31)}
  disabledDates={(date) => date.getDay() === 0}
  error="La fecha es obligatoria"
/>
```

#### Cuando usar

- Formularios que requieren una sola fecha (servicios, nómina, asistencia).
- Filtros por fecha exacta.
- Reemplazo de inputs `type="date"` nativos para mantener coherencia visual.

#### No usar cuando

- Se necesita seleccionar un rango — usar `DateRangePicker`.
- Se necesita seleccionar fecha y hora — aun no hay componente de datetime.

---

### 2.6 DateRangePicker

Selector de rango de fechas. Permite seleccionar fecha inicial y final con resaltado visual del intervalo.

**Archivo:** `src/components/ui/DateRangePicker/DateRangePicker.tsx`

**Importacion:**
```tsx
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import type { DateRange } from '@/components/ui/DateRangePicker';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `value` | `DateRange` | `undefined` | Rango seleccionado (controlado) |
| `defaultValue` | `DateRange` | `{ start: null, end: null }` | Rango inicial (no controlado) |
| `onChange` | `(range: DateRange) => void` | `undefined` | Callback al cambiar el rango |
| `label` | `string` | `undefined` | Etiqueta del campo |
| `placeholder` | `string` | `'Seleccionar rango'` | Placeholder del input |
| `error` | `string` | `undefined` | Mensaje de error |
| `disabled` | `boolean` | `false` | Deshabilitar el campo |
| `min` | `Date` | `undefined` | Fecha minima seleccionable |
| `max` | `Date` | `undefined` | Fecha maxima seleccionable |

#### Tipo DateRange

```ts
interface DateRange {
  start: Date | null;
  end: Date | null;
}
```

#### Ejemplo basico

```tsx
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import type { DateRange } from '@/components/ui/DateRangePicker';
import { useState } from 'react';

function FiltroPeriodo() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });

  return (
    <DateRangePicker
      value={range}
      onChange={setRange}
      label="Periodo del reporte"
      placeholder="Seleccionar rango de fechas"
    />
  );
}
```

#### Cuando usar

- Filtros por periodo en reportes y finanzas.
- Formularios que requieren fecha inicial y final (despachos, bitacoras, nómina).
- Reemplazo de dos inputs de fecha sueltos.

#### No usar cuando

- Se necesita solo una fecha — usar `DatePicker`.
- El rango siempre es fijo (ej. "esta semana") — usar botones predefinidos.

---

### 2.7 FormField

Wrapper estandar para agrupar un campo de formulario con su `label`, `hint` y `error`. Asegura consistencia visual en todos los formularios.

**Archivo:** `src/components/ui/FormField/FormField.tsx`

**Importacion:**
```tsx
import { FormField } from '@/components/ui/FormField';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `label` | `string` | `undefined` | Etiqueta del campo |
| `hint` | `string` | `undefined` | Texto de ayuda debajo del campo |
| `error` | `string` | `undefined` | Mensaje de error (reemplaza al hint) |
| `required` | `boolean` | `false` | Muestra asterisco de requerido |
| `htmlFor` | `string` | `undefined` | ID del campo asociado al label |
| `children` | `React.ReactNode` | *(requerido)* | Campo de entrada |

#### Ejemplo

```tsx
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

<FormField
  label="Nombre completo"
  hint="Como aparece en la identificacion oficial"
  required
  htmlFor="nombre"
>
  <Input id="nombre" placeholder="Ej. Juan Perez" />
</FormField>

<FormField
  label="Correo electronico"
  error="El correo no es valido"
  htmlFor="email"
>
  <Input id="email" type="email" />
</FormField>
```

#### Cuando usar

- Todos los campos de formulario que necesiten label, hint o error.
- Agrupar inputs, selects, datepickers, textareas, etc.

#### No usar cuando

- El campo ya trae su propio label integrado (ej. `Input` si ya lo incluye).
- No se necesita label ni validacion visual.

---

### 2.8 Checkbox

Caja de verificacion con label, estados checked/unchecked/indeterminate y manejo de error.

**Archivo:** `src/components/ui/Checkbox/Checkbox.tsx`

**Importacion:**
```tsx
import { Checkbox } from '@/components/ui/Checkbox';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `checked` | `boolean` | `undefined` | Estado controlado |
| `defaultChecked` | `boolean` | `false` | Estado inicial no controlado |
| `onChange` | `(checked: boolean) => void` | `undefined` | Callback al cambiar |
| `label` | `string` | `undefined` | Etiqueta al lado del checkbox |
| `error` | `string` | `undefined` | Mensaje de error |
| `disabled` | `boolean` | `false` | Deshabilitar |
| `indeterminate` | `boolean` | `false` | Estado indeterminado |

#### Ejemplo

```tsx
import { Checkbox } from '@/components/ui/Checkbox';
import { useState } from 'react';

function Filtros() {
  const [aceptado, setAceptado] = useState(false);

  return (
    <Checkbox
      checked={aceptado}
      onChange={setAceptado}
      label="Acepto los terminos y condiciones"
    />
  );
}
```

#### Cuando usar

- Seleccion binaria (si/no, activo/inactivo).
- Listas de opciones donde se pueden marcar multiples items.
- Estado "seleccionar todos" con `indeterminate`.

#### No usar cuando

- Solo hay dos opciones mutuamente excluyentes y visibles — usar `Radio`.
- La accion es un toggle inmediato sin confirmacion — usar `Switch`.

---

### 2.9 Radio

Boton de opcion unica para grupos mutuamente excluyentes.

**Archivo:** `src/components/ui/Radio/Radio.tsx`

**Importacion:**
```tsx
import { Radio } from '@/components/ui/Radio';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `checked` | `boolean` | `undefined` | Estado controlado |
| `defaultChecked` | `boolean` | `false` | Estado inicial no controlado |
| `onChange` | `(checked: boolean) => void` | `undefined` | Callback al cambiar |
| `label` | `string` | `undefined` | Etiqueta |
| `name` | `string` | `undefined` | Nombre del grupo |
| `value` | `string` | `undefined` | Valor del radio |
| `disabled` | `boolean` | `false` | Deshabilitar |
| `error` | `boolean` | `false` | Indica error en el grupo |

#### Ejemplo

```tsx
import { Radio } from '@/components/ui/Radio';
import { useState } from 'react';

function MetodoPago() {
  const [metodo, setMetodo] = useState('transferencia');

  return (
    <div className="space-y-2">
      <Radio
        name="metodo"
        value="transferencia"
        checked={metodo === 'transferencia'}
        onChange={() => setMetodo('transferencia')}
        label="Transferencia SPEI"
      />
      <Radio
        name="metodo"
        value="efectivo"
        checked={metodo === 'efectivo'}
        onChange={() => setMetodo('efectivo')}
        label="Efectivo"
      />
    </div>
  );
}
```

#### Cuando usar

- Seleccion unica entre varias opciones visibles.
- Opciones mutuamente excluyentes (maximo 5-7 opciones).

#### No usar cuando

- Se pueden seleccionar multiples opciones — usar `Checkbox`.
- Hay mas de 7 opciones — usar `Select` o `Combobox`.

---

### 2.10 Switch

Toggle visual para activar/desactivar una opcion.

**Archivo:** `src/components/ui/Switch/Switch.tsx`

**Importacion:**
```tsx
import { Switch } from '@/components/ui/Switch';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `checked` | `boolean` | `undefined` | Estado controlado |
| `defaultChecked` | `boolean` | `false` | Estado inicial no controlado |
| `onChange` | `(checked: boolean) => void` | `undefined` | Callback al cambiar |
| `label` | `string` | `undefined` | Etiqueta |
| `error` | `string` | `undefined` | Mensaje de error |
| `disabled` | `boolean` | `false` | Deshabilitar |

#### Ejemplo

```tsx
import { Switch } from '@/components/ui/Switch';
import { useState } from 'react';

function Notificaciones() {
  const [activo, setActivo] = useState(true);

  return (
    <Switch
      checked={activo}
      onChange={setActivo}
      label="Recibir notificaciones push"
    />
  );
}
```

#### Cuando usar

- Activar/desactivar una funcion o configuracion.
- Cambios que aplican inmediatamente.
- Estados ON/OFF claros.

#### No usar cuando

- La opcion requiere confirmacion adicional — usar `Checkbox`.
- Hay multiples opciones excluyentes — usar `Radio`.

---

### 2.11 Badge

Etiqueta visual compacta para mostrar estados, categorias o indicadores.

**Archivo:** `src/components/ui/Badge/Badge.tsx`

**Importacion:**
```tsx
import { Badge } from '@/components/ui/Badge';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` | `'neutral'` | Variante de color |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamano del badge |
| `dot` | `boolean` | `false` | Muestra un punto indicador antes del texto |
| `children` | `React.ReactNode` | *(requerido)* | Contenido del badge |

#### Variantes

| Variante | Fondo | Texto | Dot | Uso tipico |
|----------|-------|-------|-----|------------|
| `primary` | `bg-orange-100` | `text-orange-700` | `bg-orange-500` | Estado activo, principal |
| `success` | `bg-green-100` | `text-green-700` | `bg-green-500` | Completado, aprobado |
| `warning` | `bg-amber-100` | `text-amber-700` | `bg-amber-500` | Pendiente, en revision |
| `error` | `bg-red-100` | `text-red-700` | `bg-red-500` | Error, rechazado, inactivo |
| `info` | `bg-blue-100` | `text-blue-700` | `bg-blue-500` | Informativo, en proceso |
| `neutral` | `bg-slate-100` | `text-slate-600` | `bg-slate-400` | Sin estado, generico |

#### Tamanos

| Tamano | Padding | Texto |
|--------|---------|-------|
| `sm` | `px-2 py-0.5` | `text-[10px]` |
| `md` | `px-2.5 py-1` | `text-xs` |
| `lg` | `px-3 py-1` | `text-sm` |

#### Ejemplo basico

```tsx
<Badge variant="success">Activo</Badge>
<Badge variant="error">Inactivo</Badge>
<Badge variant="warning" dot>Pendiente</Badge>
```

#### Ejemplo avanzado

```tsx
import { Badge } from '@/components/ui/Badge';

// Badges en una tabla
<table>
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Carlos Hernandez</td>
      <td>
        <Badge variant="success" dot size="sm">
          Activo
        </Badge>
      </td>
    </tr>
    <tr>
      <td>Maria Lopez</td>
      <td>
        <Badge variant="error" dot size="sm">
          Inactivo
        </Badge>
      </td>
    </tr>
  </tbody>
</table>

// Badge con conteo (como badge de notificacion)
<div className="flex items-center gap-2">
  <span>Notificaciones</span>
  <Badge variant="error" size="sm">5</Badge>
</div>
```

#### Cuando usar

- Mostrar estados de registros (Activo/Inactivo, Pendiente/Completado, etc.).
- Indicadores de tipo o categoria.
- Contadores inline junto a labels.
- Cualquier texto que necesite enfasis visual con color contextual.

#### No usar cuando

- No usar para textos largos — el badge es para etiquetas cortas.
- No abusar de los puntos `dot` — usarlos solo cuando el estado necesita atencion visual.
- No usar `primary` como variante por defecto — `neutral` es mas apropiado para estados genericos.

---

## 3. Componentes de Layout

### 3.1 PageHeader

Encabezado estandar para todas las paginas del dashboard. Muestra titulo, subtitulo y un area de accion opcional.

**Archivo:** `src/components/ui/PageHeader/PageHeader.tsx`

**Importacion:**
```tsx
import { PageHeader } from '@/components/ui/PageHeader';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `title` | `string` | *(requerido)* | Titulo principal de la pagina |
| `subtitle` | `string` | `undefined` | Subtitulo descriptivo debajo del titulo |
| `action` | `React.ReactNode` | `undefined` | Elemento de accion (boton, grupo de botones, etc.) |

#### Ejemplo basico

```tsx
<PageHeader title="Trabajadores" />
```

#### Ejemplo avanzado

```tsx
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Plus, Download } from 'lucide-react';

<PageHeader
  title="Trabajadores"
  subtitle="Gestion de personal y control de asistencia"
  action={
    <div className="flex gap-3">
      <Button variant="outline" icon={<Download size={16} />}>
        Exportar
      </Button>
      <Button icon={<Plus size={16} />}>
        Nuevo Trabajador
      </Button>
    </div>
  }
/>
```

#### Cuando usar

- Al inicio de cada pagina del dashboard.
- Cuando se necesita un titulo consistente en todas las vistas.

#### No usar cuando

- No usar dentro de modales o cards — solo para encabezados de pagina.
- No duplicar el titulo si ya hay un breadcrumb o nav que lo muestra.

---

### 3.2 Tabs

Navegacion por pestanas con soporte para iconos, conteos y contenido condicional.

**Archivo:** `src/components/ui/Tabs/Tabs.tsx`

**Importacion:**
```tsx
import { Tabs, TabPanel } from '@/components/ui/Tabs';
```

#### Props de Tabs

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `tabs` | `Tab[]` | *(requerido)* | Lista de pestanas disponibles |
| `defaultTab` | `string` | Primera tab | Key de la tab activa por defecto (no controlado) |
| `value` | `string` | `undefined` | Key de la tab activa (controlado) |
| `onChange` | `(key: string) => void` | `undefined` | Callback al cambiar de tab |
| `children` | `React.ReactNode` | *(requerido)* | Contenido (debe incluir `TabPanel`) |

#### Props de TabPanel

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `tabKey` | `string` | *(requerido)* | Key que vincula el panel con su tab |
| `children` | `React.ReactNode` | *(requerido)* | Contenido del panel |

#### Tipo Tab

```ts
interface Tab {
  key: string;     // Identificador unico
  label: string;   // Texto visible en la pestana
  icon?: React.ReactNode;  // Icono opcional a la izquierda del label
  count?: number;  // Numero a la derecha del label (en badge gris)
}
```

#### Ejemplo basico

```tsx
import { Tabs, TabPanel } from '@/components/ui/Tabs';

<Tabs tabs={[
  { key: 'info', label: 'Informacion' },
  { key: 'historial', label: 'Historial' },
]}>
  <TabPanel tabKey="info">
    <p>Contenido de informacion</p>
  </TabPanel>
  <TabPanel tabKey="historial">
    <p>Contenido de historial</p>
  </TabPanel>
</Tabs>
```

#### Ejemplo avanzado

```tsx
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Settings, FileText, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';

function DetalleMaquinaria() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Tabs
      tabs={[
        { key: 'general', label: 'General', icon: <Settings size={16} /> },
        { key: 'detalles', label: 'Detalles', icon: <FileText size={16} /> },
        { key: 'historial', label: 'Historial', icon: <Clock size={16} />, count: 12 },
      ]}
      value={activeTab}
      onChange={setActiveTab}
    >
      <TabPanel tabKey="general">
        <Card padding="md">
          <p className="text-sm text-slate-700">Informacion principal de la maquinaria.</p>
        </Card>
      </TabPanel>
      <TabPanel tabKey="detalles">
        <Card padding="md">
          <p className="text-sm text-slate-700">Especificaciones tecnicas y mantenimiento.</p>
        </Card>
      </TabPanel>
      <TabPanel tabKey="historial">
        <Card padding="md">
          <p className="text-sm text-slate-700">Registro de movimientos y cambios.</p>
        </Card>
      </TabPanel>
    </Tabs>
  );
}
```

#### Cuando usar

- Navegar entre secciones de una misma pagina (detalles, historial, configuracion).
- Filtrar contenido por categoria dentro de un modulo.
- Mostrar multiples vistas sin navegar a otra pagina.

#### No usar cuando

- No usar para navegacion principal del sitio (usar Sidebar).
- No usar mas de 5-6 tabs — si hay mas, reconsiderar la informacion architecture.
- No usar `TabPanel` sin envolver en `Tabs` — el contexto de `TabsContext` es necesario.

---

### 3.3 Grid

Sistema de grillas para layouts responsivos. Soporta columnas fijas, columnas por breakpoint, gaps personalizados y alineacion.

**Archivo:** `src/components/ui/Grid/Grid.tsx`

**Importacion:**
```tsx
import { Grid } from '@/components/ui/Grid';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `columns` | `GridColumns \| ResponsiveColumns` | `1` | Numero de columnas |
| `gap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Espaciado entre celdas |
| `rowGap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `undefined` | Espaciado vertical (opcional) |
| `columnGap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `undefined` | Espaciado horizontal (opcional) |
| `alignItems` | `'start' \| 'center' \| 'end' \| 'stretch'` | `undefined` | Alineacion vertical de celdas |
| `justifyItems` | `'start' \| 'center' \| 'end' \| 'stretch'` | `undefined` | Alineacion horizontal de celdas |
| `as` | `'div' \| 'section' \| 'article' \| 'ul' \| 'ol'` | `'div'` | Elemento HTML |

#### Columnas

Puede ser un numero fijo:

```tsx
<Grid columns={4} gap="md">
  <Card>A</Card>
  <Card>B</Card>
  <Card>C</Card>
  <Card>D</Card>
</Grid>
```

O un objeto responsive por breakpoint:

```tsx
<Grid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
  <Card>A</Card>
  <Card>B</Card>
  <Card>C</Card>
  <Card>D</Card>
</Grid>
```

#### Tamanos de gap

| Gap | Valor |
|-----|-------|
| `none` | 0px |
| `xs` | 8px |
| `sm` | 12px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |

#### Ejemplos

**Grid de KPIs (1 col movil, 2 tablet, 4 desktop):**

```tsx
<Grid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
  <StatsCard icon={<Users size={22} />} value="1,248" label="Trabajadores" />
  <StatsCard icon={<Truck size={22} />} value="36" label="Unidades" />
  <StatsCard icon={<DollarSign size={22} />} value="$2.4M" label="Ingresos" />
  <StatsCard icon={<Activity size={22} />} value="87%" label="Eficiencia" />
</Grid>
```

**Grid con gaps separados:**

```tsx
<Grid columns={3} rowGap="lg" columnGap="sm">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

#### Cuando usar

- Layouts de dashboard con KPIs, cards o formularios.
- Listados de tarjetas que deben adaptarse a diferentes tamanos de pantalla.
- Reemplazar clases de Tailwind como `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.

#### No usar cuando

- Para una sola columna simple — usar `Stack`.
- Para alinear elementos en una sola fila sin grid — usar `Stack direction="horizontal"`.
- Cuando se necesita control total de areas especificas — usar CSS Grid directo.

---

### 3.4 Center

Componente para centrar contenido vertical y/o horizontalmente. Util para estados vacios, loaders, iconos centrados y contenido dentro de contenedores.

**Archivo:** `src/components/ui/Center/Center.tsx`

**Importacion:**
```tsx
import { Center } from '@/components/ui/Center';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `axis` | `'both' \| 'vertical' \| 'horizontal'` | `'both'` | Eje de centrado |
| `inline` | `boolean` | `false` | Usar `inline-flex`. Cuando es `true`, el elemento por defecto es `span` para evitar errores de anidacion en `<p>`. |
| `as` | `'div' \| 'span' \| 'section' \| 'article' \| 'main' \| 'header' \| 'footer'` | `'div'` (`'span'` si `inline`) | Elemento HTML |

#### Ejemplos

**Centrado completo:**

```tsx
<Center className="h-64">
  <EmptyState title="Sin resultados" />
</Center>
```

**Solo vertical:**

```tsx
<Center axis="vertical" className="h-32">
  <p>Texto centrado verticalmente</p>
</Center>
```

**Inline (dentro de texto):**

```tsx
<p>
  Estado: <Center inline axis="both"><Badge>Activo</Badge></Center>
</p>
```

#### Cuando usar

- Estados vacios o de carga dentro de contenedores.
- Iconos o badges centrados dentro de cards.
- Contenido que debe estar perfectamente centrado sin hacks de margin.

#### No usar cuando

- Para alinear texto — usar clases de Tailwind como `text-center`.
- Para layouts de una sola dimension con multiples elementos — usar `Stack`.
- Para grillas — usar `Grid`.

---

### 3.5 Spacer

Espaciador declarativo para separar elementos sin usar clases de margin. Util cuando el espaciado no es responsabilidad de los componentes hijos.

**Archivo:** `src/components/ui/Spacer/Spacer.tsx`

**Importacion:**
```tsx
import { Spacer } from '@/components/ui/Spacer';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `size` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'md'` | Tamano del espaciador |
| `axis` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Direccion del espaciado |

#### Tamanos

| Size | Valor |
|------|-------|
| `none` | 0px |
| `xs` | 8px |
| `sm` | 12px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |
| `3xl` | 64px |

#### Ejemplos

**Espaciado vertical:**

```tsx
<div>
  <h2>Seccion 1</h2>
  <Spacer size="lg" />
  <h2>Seccion 2</h2>
</div>
```

**Espaciado horizontal:**

```tsx
<div className="flex items-center">
  <span>Izquierda</span>
  <Spacer axis="horizontal" size="md" />
  <span>Derecha</span>
</div>
```

#### Cuando usar

- Cuando se necesita espacio entre elementos sin modificar sus estilos.
- Para espaciado condicional o dinamico.
- Para mantener componentes hijos desacoplados del layout que los rodea.

#### No usar cuando

- El espaciado es siempre el mismo y puede manejarse con `Stack` o `gap`.
- Se puede usar padding/margin del contenedor padre.

---

### 3.6 Flex

Wrapper flexbox de bajo nivel con control total de direccion, wrap, alineacion y gap. Usar para layouts de una dimension que requieren opciones avanzadas.

**Archivo:** `src/components/ui/Flex/Flex.tsx`

**Importacion:**
```tsx
import { Flex } from '@/components/ui/Flex';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `direction` | `'row' \| 'row-reverse' \| 'column' \| 'column-reverse'` | `'row'` | Direccion del flex |
| `wrap` | `'nowrap' \| 'wrap' \| 'wrap-reverse'` | `'nowrap'` | Comportamiento de wrap |
| `justify` | `'start' \| 'end' \| 'center' \| 'between' \| 'around' \| 'evenly'` | `undefined` | Alineacion principal |
| `align` | `'start' \| 'end' \| 'center' \| 'baseline' \| 'stretch'` | `undefined` | Alineacion transversal |
| `gap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Espaciado entre hijos |
| `inline` | `boolean` | `false` | Usar `inline-flex` |
| `fullWidth` | `boolean` | `false` | `w-full` |
| `fullHeight` | `boolean` | `false` | `h-full` |
| `as` | elemento HTML | `'div'` | Elemento a renderizar |

#### Ejemplos

**Fila con distribucion:**

```tsx
<Flex justify="between" align="center">
  <h2>Titulo</h2>
  <Button>Accion</Button>
</Flex>
```

**Columna apilada:**

```tsx
<Flex direction="column" gap="sm">
  <span>Paso 1</span>
  <span>Descripcion</span>
  <Badge>Completado</Badge>
</Flex>
```

**Flex generico con wrap:**

```tsx
<Flex wrap="wrap" gap="sm">
  {items.map((item) => <Tag key={item.id}>{item.name}</Tag>)}
</Flex>
```

#### Cuando usar

- Cuando se necesita control total de direccion, wrap o alineaciones.
- Para filas de elementos con `justify="between"`.
- Para layouts de una dimension complejos.

#### No usar cuando

- Para espaciado simple vertical u horizontal — usar `Stack`.
- Para layouts de dos dimensiones — usar `Grid`.
- Para centrar un solo elemento — usar `Center`.

---

### 3.7 AspectRatio

Contenedor que mantiene una proporcion de aspecto fija. Util para imagenes, videos, tarjetas con imagenes y mapas.

**Archivo:** `src/components/ui/AspectRatio/AspectRatio.tsx`

**Importacion:**
```tsx
import { AspectRatio } from '@/components/ui/AspectRatio';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `ratio` | `AspectRatioValue` | `'video'` | Proporcion de aspecto |
| `contentClassName` | `string` | `undefined` | Clases para el contenedor interno |
| `as` | `'div' \| 'section' \| 'article' \| 'figure'` | `'div'` | Elemento HTML |

#### Valores de ratio

| Valor | Proporcion | Uso tipico |
|-------|------------|------------|
| `'square'` | 1 / 1 | Avatares, logos, thumbnails |
| `'video'` | 16 / 9 | Videos, dashboards, graficas |
| `'photo'` | 4 / 3 | Fotografias |
| `'portrait'` | 3 / 4 | Fotos verticales, tarjetas |
| `'wide'` | 21 / 9 | Pantallas panoramicas |
| `'cinema'` | 2.39 / 1 | Contenido cinematografico |
| `number` | custom | Cualquier proporcion (ej: `2.39`) |

#### Ejemplos

**Video placeholder:**

```tsx
<AspectRatio ratio="video" className="rounded-xl overflow-hidden bg-slate-900">
  <video src="..." className="w-full h-full object-cover" />
</AspectRatio>
```

**Imagen cuadrada:**

```tsx
<AspectRatio ratio="square" className="rounded-lg overflow-hidden">
  <img src="..." alt="..." className="w-full h-full object-cover" />
</AspectRatio>
```

**Ratio numerico personalizado:**

```tsx
<AspectRatio ratio={2.39} className="rounded-xl bg-slate-100">
  <span>Cinema</span>
</AspectRatio>
```

#### Cuando usar

- Contenedores de video o imagen que deben mantener proporcion.
- Placeholders de contenido multimedia.
- Tarjetas con imagenes de tamano consistente.

#### No usar cuando

- El contenido no debe recortarse ni escalar — usar un contenedor flexible.
- Se necesita altura fija independiente del ancho.

---

### 3.8 VisuallyHidden

Oculta contenido visualmente manteniendolo accesible para lectores de pantalla. Esencial para accesibilidad (a11y).

**Archivo:** `src/components/ui/VisuallyHidden/VisuallyHidden.tsx`

**Importacion:**
```tsx
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `focusable` | `boolean` | `false` | Hace el contenido visible al recibir foco (util para "skip links") |
| `as` | `'span' \| 'div' \| 'label'` | `'span'` | Elemento HTML |

#### Ejemplos

**Texto para screen readers en boton con icono:**

```tsx
<button>
  <Search size={20} />
  <VisuallyHidden>Buscar trabajadores</VisuallyHidden>
</button>
```

**Skip link (accesible por teclado):**

```tsx
<a href="#main-content">
  <VisuallyHidden focusable>
    Saltar al contenido principal
  </VisuallyHidden>
</a>
```

**Label oculto para input:**

```tsx
<label>
  <VisuallyHidden as="label">Correo electronico</VisuallyHidden>
  <input type="email" placeholder="correo@ejemplo.com" />
</label>
```

#### Cuando usar

- Botones que solo muestran iconos.
- Enlaces "saltar al contenido".
- Texto adicional para contexto sin alterar el diseno visual.
- Labels de formularios cuando el placeholder es suficiente visualmente.

#### No usar cuando

- El contenido debe ser visible para todos los usuarios.
- Se puede mostrar el texto sin romper el diseno.

---

### 3.9 Show / Hide

Componentes para mostrar u ocultar contenido segun el breakpoint. Wrapper semantico sobre las clases de Tailwind.

**Archivos:**
- `src/components/ui/Show/Show.tsx`
- `src/components/ui/Hide/Hide.tsx`

**Importacion:**
```tsx
import { Show, Hide } from '@/components/ui/Show';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `above` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `undefined` | Mostrar/ocultar por encima del breakpoint |
| `below` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `undefined` | Mostrar/ocultar por debajo del breakpoint |
| `as` | `'div' \| 'span' \| 'section' \| 'article'` | `'div'` | Elemento HTML |

#### Ejemplos

**Mostrar solo en desktop:**

```tsx
<Show above="md">
  <Sidebar />
</Show>
```

**Ocultar en desktop:**

```tsx
<Hide above="md">
  <MobileMenuButton />
</Hide>
```

**Texto adaptativo:**

```tsx
<Show above="md">
  <span>Vista desktop</span>
</Show>
<Hide above="md">
  <span>Vista movil</span>
</Hide>
```

#### Cuando usar

- Mostrar u ocultar contenido segun el tamano de pantalla.
- Renderizar interfaces diferentes para movil y desktop.
- Evitar duplicar logica condicional con `useMediaQuery`.

#### No usar cuando

- Se necesita animacion de entrada/salida — usar CSS transitions o Framer Motion.
- El contenido debe seguir en el DOM pero ser invisible — usar `hidden` directamente.

---

### 3.10 ScrollArea

Contenedor con scroll controlado. Permite definir orientacion, dimensiones maximas, padding y ocultar la barra de scroll nativa.

**Archivo:** `src/components/ui/ScrollArea/ScrollArea.tsx`

**Importacion:**
```tsx
import { ScrollArea } from '@/components/ui/ScrollArea';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical' \| 'both'` | `'vertical'` | Direccion del scroll |
| `maxHeight` | `string` | `undefined` | Altura maxima (ej: `'200px'`) |
| `maxWidth` | `string` | `undefined` | Ancho maxima |
| `padding` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'none'` | Padding interno |
| `hideScrollbar` | `boolean` | `false` | Ocultar scrollbar nativo |
| `as` | `'div' \| 'section' \| 'article'` | `'div'` | Elemento HTML |

#### Ejemplos

**Scroll vertical:**

```tsx
<ScrollArea maxHeight="200px" orientation="vertical" padding="sm">
  {items.map((item) => (
    <p key={item.id}>{item.name}</p>
  ))}
</ScrollArea>
```

**Scroll horizontal:**

```tsx
<ScrollArea orientation="horizontal" padding="sm">
  <div className="flex gap-3 min-w-max">
    {tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
  </div>
</ScrollArea>
```

**Sin scrollbar visible:**

```tsx
<ScrollArea maxHeight="160px" hideScrollbar>
  {longContent}
</ScrollArea>
```

#### Cuando usar

- Listas largas dentro de cards o modales.
- Tablas o tags que exceden el ancho disponible.
- Cuando se necesita scroll pero sin mostrar la barra nativa.

#### No usar cuando

- El contenido debe expandirse naturalmente — usar `Stack` o `Grid`.
- Se puede usar el scroll de la pagina completa.

---

### 3.11 Separator

Separador visual simple que soporta orientacion horizontal y vertical. Mas ligero que `Divider` y util para separar elementos en filas o columnas.

**Archivo:** `src/components/ui/Separator/Separator.tsx`

**Importacion:**
```tsx
import { Separator } from '@/components/ui/Separator';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientacion del separador |
| `size` | `'thin' \| 'medium' \| 'thick'` | `'thin'` | Grosor del separador |
| `decorative` | `boolean` | `true` | Si es decorativo, no expone `role="separator"` |

#### Ejemplos

**Horizontal:**

```tsx
<div>
  <p>Arriba</p>
  <Separator />
  <p>Abajo</p>
</div>
```

**Vertical en una fila:**

```tsx
<div className="flex items-center gap-4">
  <span>Izquierda</span>
  <Separator orientation="vertical" size="medium" />
  <span>Derecha</span>
</div>
```

**Accesible (no decorativo):**

```tsx
<Separator decorative={false} aria-label="Seccion siguiente" />
```

#### Cuando usar

- Separar elementos horizontalmente o verticalmente.
- Cuando se necesita un separador simple sin label.
- Dentro de toolbars, menus, o listas.

#### No usar cuando

- Se necesita un label centrado — usar `Divider`.
- Se necesita un separador con estilo dashed/dotted — usar `Divider`.

---

### 3.12 Box

Contenedor basico y flexible para agrupar contenido. Permite configurar padding, radio, sombra, fondo y borde de forma declarativa.

**Archivo:** `src/components/ui/Box/Box.tsx`

**Importacion:**
```tsx
import { Box } from '@/components/ui/Box';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `padding` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'none'` | Padding interno |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'none'` | Border radius |
| `shadow` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'none'` | Sombra |
| `background` | `'transparent' \| 'white' \| 'slate' \| 'primary' \| 'secondary'` | `'transparent'` | Fondo |
| `border` | `'none' \| 'default' \| 'primary'` | `'none'` | Borde |
| `fullWidth` | `boolean` | `false` | `w-full` |
| `fullHeight` | `boolean` | `false` | `h-full` |
| `as` | elemento HTML | `'div'` | Elemento a renderizar |

#### Ejemplos

**Card simple:**

```tsx
<Box padding="md" radius="lg" background="white" border="default" shadow="sm">
  <p>Contenido</p>
</Box>
```

**Destacado:**

```tsx
<Box padding="lg" radius="xl" background="primary" border="primary">
  <h3>Importante</h3>
  <p>Informacion destacada</p>
</Box>
```

**Ancho completo:**

```tsx
<Box padding="lg" background="white" border="default" shadow="md" fullWidth>
  <p>Seccion completa</p>
</Box>
```

#### Cuando usar

- Para agrupar contenido sin crear un componente especifico.
- Cuando se necesita un contenedor con padding/background/borde rapido.
- Como base para layouts simples.

#### No usar cuando

- Se necesita un componente semantico especifico — usar `Card`, `Container`, etc.
- El contenido requiere logica interna — crear un componente propio.

---

### 3.13 Collapse

Componente para expandir/colapsar contenido con animacion suave. Utiliza `grid-template-rows` para lograr la transicion sin necesidad de conocer la altura del contenido.

**Archivo:** `src/components/ui/Collapse/Collapse.tsx`

**Importacion:**
```tsx
import { Collapse } from '@/components/ui/Collapse';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `in` | `boolean` | `false` | Controla si el contenido esta visible |
| `innerClassName` | `string` | `undefined` | Clases para el contenedor interno |

#### Ejemplo

```tsx
import { useState } from 'react';
import { Collapse } from '@/components/ui/Collapse';
import { Button } from '@/components/ui/Button';

function Detalles() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(!open)}>
        {open ? 'Ocultar' : 'Mostrar'}
      </Button>
      <Collapse in={open}>
        <div className="pt-4">
          <p>Contenido expandible</p>
        </div>
      </Collapse>
    </div>
  );
}
```

#### Cuando usar

- Acordiones simples.
- Mostrar/ocultar detalles adicionales.
- FAQ o secciones expandibles.

#### No usar cuando

- Se necesita animacion compleja — usar Framer Motion.
- Se requiere solo un acordeon abierto a la vez — implementar logica de grupo.

---

### 3.14 Portal

Renderiza contenido en un nodo DOM diferente al arbol principal. Util para modales, tooltips, dropdowns y overlays que deben escapar del stacking context del padre.

**Archivo:** `src/components/ui/Portal/Portal.tsx`

**Importacion:**
```tsx
import { Portal } from '@/components/ui/Portal';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `container` | `HTMLElement \| null` | `document.body` | Nodo DOM destino |
| `children` | `React.ReactNode` | — | Contenido a renderizar |

#### Ejemplo

```tsx
<Portal>
  <div className="fixed inset-0 z-50">
    Contenido fuera del DOM padre
  </div>
</Portal>
```

#### Cuando usar

- Modales y dialogs.
- Dropdowns que deben sobresalir de contenedores con `overflow: hidden`.
- Tooltips y popovers.

#### No usar cuando

- El contenido debe heredar estilos del padre.
- No hay necesidad de escapar del DOM actual.

---

### 3.15 Overlay

Capa semitransparente que cubre toda la pantalla. Se usa detras de modales, drawers y menus moviles.

**Archivo:** `src/components/ui/Overlay/Overlay.tsx`

**Importacion:**
```tsx
import { Overlay } from '@/components/ui/Overlay';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `open` | `boolean` | `true` | Mostrar overlay |
| `blur` | `boolean` | `false` | Aplicar backdrop-blur |
| `dark` | `boolean` | `true` | Fondo oscuro semitransparente |
| `offsetLeft` | `number` | `0` | Pixeles a omitir en el lado izquierdo (ej. ancho del sidebar) |
| `onClick` | `() => void` | `undefined` | Click en el overlay |

#### Ejemplo

```tsx
<Overlay onClick={closeModal} blur>
  <ModalContent />
</Overlay>
```

#### Cuando usar

- Detras de modales para enfocar atencion.
- Menus laterales (drawers) en movil.
- Lightboxes y galerias.

#### No usar cuando

- Se necesita interactuar con el contenido de fondo.
- Se puede usar un dropdown sin bloquear la pantalla.

---

### 3.16 Stack

Componente de layout para espaciado consistente entre elementos. Reemplaza `space-y-*` y `gap-*` con una API semantica.

**Archivo:** `src/components/ui/Stack/Stack.tsx`

**Importacion:**
```tsx
import { Stack } from '@/components/ui/Stack';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Direccion del stack |
| `gap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Espaciado entre elementos |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | Alineacion transversal |
| `wrap` | `boolean` | `false` | Permitir wrap en horizontal |
| `as` | `'div' \| 'section' \| 'article' \| 'nav' \| 'ul' \| 'ol'` | `'div'` | Elemento HTML a renderizar |

#### Tamanos de gap

| Gap | Valor | Uso tipico |
|-----|-------|------------|
| `none` | 0px | Sin espaciado |
| `xs` | 4px | Espaciado minimo |
| `sm` | 8px | Elementos muy cercanos |
| `md` | 16px | Espaciado estandar (default) |
| `lg` | 24px | Entre secciones |
| `xl` | 32px | Separacion amplia |

#### Ejemplo

```tsx
import { Stack } from '@/components/ui/Stack';

// Stack vertical (reemplaza space-y-4)
<Stack gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Stack>

// Stack horizontal (reemplaza flex gap-4)
<Stack direction="horizontal" gap="sm">
  <Button>A</Button>
  <Button>B</Button>
  <Button>C</Button>
</Stack>

// Stack centrado
<Stack gap="lg" align="center">
  <Icon />
  <Text />
</Stack>
```

---

### 3.17 Container

Contenedor con max-width y padding centralizado. Define la "zona segura" del contenido.

**Archivo:** `src/components/ui/Container/Container.tsx`

**Importacion:**
```tsx
import { Container } from '@/components/ui/Container';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'xl'` | Max-width del contenedor |
| `padding` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Padding interno |
| `center` | `boolean` | `true` | Centrar horizontalmente |
| `as` | `'div' \| 'section' \| 'article' \| 'main' \| 'aside'` | `'div'` | Elemento HTML |

#### Max-widths

| Size | Max-width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `full` | 100% |

#### Ejemplo

```tsx
import { Container } from '@/components/ui/Container';

// Contenedor centrado con padding de 24px
<Container size="xl" padding="md">
  <h1>Mi Pagina</h1>
</Container>

// Contenedor estrecho para formularios
<Container size="md" padding="lg">
  <Form />
</Container>
```

---

### 3.18 Divider

Separador visual horizontal con soporte para labels y variantes de borde.

**Archivo:** `src/components/ui/Divider/Divider.tsx`

**Importacion:**
```tsx
import { Divider } from '@/components/ui/Divider';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `variant` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | Estilo del borde |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Espaciado vertical |
| `label` | `string` | `undefined` | Texto centrado en el divisor |

#### Ejemplo

```tsx
import { Divider } from '@/components/ui/Divider';

// Linea simple
<Divider />

// Divider con label
<Divider label="O seccion" />

// Variante dashed con spacing amplio
<Divider variant="dashed" spacing="lg" />
```

---

## 4. Componentes de Feedback

### 4.1 StatsCard

Tarjeta de estadisticas con icono, valor numerico, label y trend indicativo.

**Archivo:** `src/components/ui/StatsCard/StatsCard.tsx`

**Importacion:**
```tsx
import { StatsCard } from '@/components/ui/StatsCard';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | *(requerido)* | Icono de la estadistica |
| `value` | `string \| number` | *(requerido)* | Valor numerico o texto a mostrar |
| `label` | `string` | *(requerido)* | Descripcion de la metrica |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` | `'primary'` | Color del icono y fondo del icono |
| `trend` | `'up' \| 'down' \| 'neutral'` | `undefined` | Direccion del trend (flecha) |
| `trendValue` | `string` | `undefined` | Texto del trend (ej: "+12%", "-5%") |
| `onClick` | `() => void` | `undefined` | Hace la tarjeta clickeable |

#### Colores del icono

| Color | Fondo icono | Texto icono |
|-------|------------|-------------|
| `primary` | `bg-primary/10` | `text-primary` |
| `success` | `bg-green-100` | `text-green-600` |
| `warning` | `bg-amber-100` | `text-amber-600` |
| `error` | `bg-red-100` | `text-red-600` |
| `info` | `bg-blue-100` | `text-blue-600` |
| `neutral` | `bg-slate-100` | `text-slate-500` |

#### Trends

| Trend | Icono | Colores |
|-------|-------|---------|
| `up` | `TrendingUp` | Texto verde, fondo verde claro |
| `down` | `TrendingDown` | Texto rojo, fondo rojo claro |
| `neutral` | `Minus` | Texto gris, fondo gris claro |

#### Ejemplo basico

```tsx
import { StatsCard } from '@/components/ui/StatsCard';
import { Users } from 'lucide-react';

<StatsCard
  icon={<Users size={22} />}
  value="1,248"
  label="Trabajadores Activos"
/>
```

#### Ejemplo avanzado

```tsx
import { StatsCard } from '@/components/ui/StatsCard';
import { Users, Truck, DollarSign, Activity } from 'lucide-react';

// Grid de estadisticas del dashboard
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard
    icon={<Users size={22} />}
    value="1,248"
    label="Trabajadores Activos"
    color="primary"
    trend="up"
    trendValue="+12%"
  />
  <StatsCard
    icon={<Truck size={22} />}
    value="36"
    label="Unidades Operando"
    color="success"
    trend="up"
    trendValue="+3"
  />
  <StatsCard
    icon={<DollarSign size={22} />}
    value="$2.4M"
    label="Ingresos del Mes"
    color="warning"
    trend="down"
    trendValue="-5%"
  />
  <StatsCard
    icon={<Activity size={22} />}
    value="87%"
    label="Eficiencia General"
    color="info"
    trend="neutral"
    trendValue="0%"
  />
</div>

// StatsCard clickeable
<StatsCard
  icon={<Users size={22} />}
  value="24"
  label="Trabajadores"
  color="primary"
  onClick={() => router.push('/trabajadores')}
/>
```

#### Ejemplos por categoria

**KPIs Operativos:**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard
    icon={<Timer size={22} />}
    value="8,420 h"
    label="Horas Trabajadas"
    color="info"
    trend="up"
    trendValue="+8%"
  />
  <StatsCard
    icon={<Fuel size={22} />}
    value="12,450 L"
    label="Combustible Consumido"
    color="warning"
    trend="down"
    trendValue="-3%"
  />
  <StatsCard
    icon={<Wrench size={22} />}
    value="7"
    label="Mantenimientos Pendientes"
    color="error"
    trend="up"
    trendValue="+2"
  />
  <StatsCard
    icon={<HardHat size={22} />}
    value="14"
    label="Proyectos Activos"
    color="success"
    trend="neutral"
    trendValue="0"
  />
</div>
```

**KPIs Financieros:**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard
    icon={<CreditCard size={22} />}
    value="$845K"
    label="Cuentas por Cobrar"
    color="success"
    trend="up"
    trendValue="+4%"
  />
  <StatsCard
    icon={<Banknote size={22} />}
    value="$320K"
    label="Cuentas por Pagar"
    color="error"
    trend="down"
    trendValue="-12%"
  />
  <StatsCard
    icon={<TrendingUp size={22} />}
    value="32%"
    label="Margen Bruto"
    color="primary"
    trend="up"
    trendValue="+2%"
  />
  <StatsCard
    icon={<DollarSign size={22} />}
    value="$1.1M"
    label="Costos Operativos"
    color="neutral"
    trend="down"
    trendValue="-1%"
  />
</div>
```

**KPIs Interactivos (Clickables):**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard
    icon={<AlertTriangle size={22} />}
    value="3"
    label="Incidentes Reportados"
    color="error"
    trend="down"
    trendValue="-1"
    onClick={() => router.push('/incidentes')}
  />
  <StatsCard
    icon={<Package size={22} />}
    value="28"
    label="Bajo Stock Inventario"
    color="warning"
    trend="up"
    trendValue="+5"
    onClick={() => router.push('/inventario')}
  />
  <StatsCard
    icon={<MapPin size={22} />}
    value="18"
    label="Unidades en Ruta"
    color="info"
    trend="up"
    trendValue="+2"
    onClick={() => router.push('/gps')}
  />
  <StatsCard
    icon={<CheckCircle2 size={22} />}
    value="96%"
    label="Tareas Completadas"
    color="success"
    trend="up"
    trendValue="+3%"
    onClick={() => router.push('/tareas')}
  />
</div>
```

**Sin Tendencia:**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard
    icon={<Clock size={22} />}
    value="6.2 h"
    label="Horas Promedio por Turno"
    color="neutral"
  />
  <StatsCard
    icon={<Users size={22} />}
    value="42"
    label="Operadores Disponibles"
    color="primary"
  />
</div>
```

### 4.2 Cuando usar

- Dashboard principal con metricas resumen.
- KPIs en la parte superior de paginas de modulo.
- Resumenes de datos en cualquier vista de administracion.
- Navegacion rapida a modulos usando `onClick`.

### 4.3 No usar cuando

- No usar para datos detallados — usar `DataTable`.
- No usar sin icono — el icono es parte fundamental del diseno.
- No abusar de los trends — solo mostrarlos cuando hay datos comparativos reales.
- No agrupar KPIs de diferentes areas sin un titulo de seccion claro.

---

### 4.2 EmptyState

Mensaje visual para cuando no hay datos disponibles. Incluye icono, titulo, subtitulo y accion opcional.

**Archivo:** `src/components/ui/EmptyState/EmptyState.tsx`

**Importacion:**
```tsx
import { EmptyState } from '@/components/ui/EmptyState';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | `<FileSearch size={36} />` | Icono a mostrar (dentro de circulo naranja) |
| `title` | `string` | `'No hay registros'` | Titulo del estado vacio |
| `subtitle` | `string` | `'No se encontraron resultados para tu busqueda.'` | Mensaje descriptivo |
| `action` | `React.ReactNode` | `undefined` | Elemento de accion (boton) |

#### Ejemplo basico

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState />
```

#### Ejemplo avanzado

```tsx
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Filter } from 'lucide-react';

// Empty state con accion personalizada
<EmptyState
  icon={<AlertCircle size={36} />}
  title="Sin resultados"
  subtitle="No se encontraron registros que coincidan con los filtros aplicados."
  action={
    <Button variant="outline" icon={<Filter size={16} />}>
      Limpiar Filtros
    </Button>
  }
/>

// Empty state en una tabla vacia
<DataTable
  columns={columns}
  data={[]}
  keyExtractor={() => ''}
  emptyText="No hay trabajadores registrados"
/>

// Empty state personalizado para una busqueda
<EmptyState
  title="Sin coincidencias"
  subtitle="Intenta con otros terminos de busqueda o revisa los filtros."
  action={
    <Button variant="ghost" onClick={() => clearFilters()}>
      Limpiar busqueda
    </Button>
  }
/>
```

#### Cuando usar

- Tablas o listas sin datos.
- Resultados de busqueda sin coincidencias.
- Estados iniciales de modulos nuevos.
- Despues de aplicar filtros que no devuelven resultados.

#### No usar cuando

- No usar para errores de conexion — usar un componente de error dedicado.
- No usar dentro de modales que ainda estan cargando — usar un skeleton/spinner.

---

### 4.3 Avatar

Representacion visual de un usuario con iniciales automaticas o imagen. Asigna colores automaticamente basandose en el hash del nombre.

**Archivo:** `src/components/ui/Avatar/Avatar.tsx`

**Importacion:**
```tsx
import { Avatar } from '@/components/ui/Avatar';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `name` | `string` | `''` | Nombre del usuario (para iniciales y color auto) |
| `src` | `string` | `undefined` | URL de la imagen del avatar |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamano del avatar |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` | *(auto)* | Color explicito (sobreescribe el auto) |

#### Tamanos

| Tamano | Dimensiones | Texto |
|--------|------------|-------|
| `sm` | `w-8 h-8` (32px) | `text-xs` |
| `md` | `w-10 h-10` (40px) | `text-sm` |
| `lg` | `w-14 h-14` (56px) | `text-lg` |

#### Colores (cuando se especifican o se usan como fallback)

| Color | Fondo | Texto |
|-------|-------|-------|
| `primary` | `bg-primary/10` | `text-primary` |
| `success` | `bg-green-100` | `text-green-600` |
| `warning` | `bg-amber-100` | `text-amber-600` |
| `error` | `bg-red-100` | `text-red-600` |
| `info` | `bg-blue-100` | `text-blue-600` |
| `neutral` | `bg-slate-100` | `text-slate-500` |

#### Asignacion automatica de color

Cuando no se especifica `color`, el componente calcula un hash del `name` y selecciona un color del pool `['primary', 'success', 'warning', 'info', 'error']`. Esto garantiza que cada nombre tenga un color consistente pero distribuido.

#### Ejemplo basico

```tsx
<Avatar name="Carlos Hernandez" />
<Avatar name="Maria Lopez" size="lg" />
```

#### Ejemplo avanzado

```tsx
import { Avatar } from '@/components/ui/Avatar';

// Avatares con iniciales (auto-color)
<div className="flex items-center gap-4">
  <Avatar name="Carlos Hernandez" />       {/* CH - color auto */}
  <Avatar name="Maria Lopez" />            {/* ML - color auto */}
  <Avatar name="Juan Perez" />             {/* JP - color auto */}
  <Avatar name="Ana Garcia" size="lg" />   {/* AG - tamano grande */}
</div>

// Avatares con imagen
<Avatar name="Carlos" src="/avatars/carlos.jpg" size="md" />

// Avatares con color explicito
<Avatar name="CS" color="primary" size="lg" />

// Avatar en una lista de usuarios
<div className="flex items-center gap-3">
  <Avatar name="Carlos Hernandez" size="sm" />
  <div>
    <p className="text-sm font-semibold text-slate-900">Carlos Hernandez</p>
    <p className="text-xs text-slate-500">Operador</p>
  </div>
</div>
```

#### Cuando usar

- Listas de usuarios o trabajadores.
- Comentarios o actividades de usuario.
- Headers de perfil de usuario.
- Cualquier lugar que necesite identificar visualmente a una persona.

#### No usar cuando

- No usar para logos de empresa o iconos genericos — usar un `<div>` con estilo propio.
- No usar `src` y `name` juntos sin contexto — si hay imagen, las iniciales no se muestran.

---

### 4.4 LoadingState

Componente de carga centrado con spinner animado, titulo y subtitulo opcional. Util para estados de carga de pagina completa o secciones grandes.

**Archivo:** `src/components/ui/LoadingState/LoadingState.tsx`

**Importacion:**
```tsx
import { LoadingState } from '@/components/ui/LoadingState';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `title` | `string` | `'Cargando...'` | Texto principal junto al spinner |
| `subtitle` | `string` | `undefined` | Texto secundario descriptivo |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamano del spinner (16px / 24px / 32px) |

#### Diseno visual

- Container: flex centrado vertical y horizontalmente, `py-12`
- Spinner: borde `slate-200` / `primary` con `animate-spin`, bordes redondeados
- Titulo: `text-sm font-semibold text-slate-700`
- Subtitulo: `text-xs text-slate-500`

#### Ejemplo basico

```tsx
import { LoadingState } from '@/components/ui/LoadingState';

<LoadingState />
```

#### Ejemplo avanzado

```tsx
import { LoadingState } from '@/components/ui/LoadingState';

// Carga de pagina completa
<LoadingState
  title="Cargando trabajadores..."
  subtitle="Esto puede tomar unos segundos"
  size="lg"
/>

// Carga inline pequeña
<LoadingState title="Guardando..." size="sm" />
```

#### Cuando usar

- Carga inicial de paginas o modulos.
- Operaciones largas (exportar, procesar nomina).
- Fetching de datos antes de renderizar una tabla.

#### No usar cuando

- No usar para carga dentro de botones — usar `Button` con `loading`.
- No usar para esqueletos de contenido — usar `Skeleton`.

---

### 4.5 Skeleton

Placeholder visual animado que simula la estructura del contenido mientras se carga. Soporta multiples variantes predefinidas.

**Archivo:** `src/components/ui/Skeleton/Skeleton.tsx`

**Importacion:**
```tsx
import { Skeleton } from '@/components/ui/Skeleton';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `variant` | `'text' \| 'circle' \| 'avatar' \| 'button' \| 'card' \| 'row' \| 'table'` | `'text'` | Variante del esqueleto |
| `lines` | `number` | `1` | Numero de lineas (solo para `text` y `table`) |
| `className` | `string` | `undefined` | Clases adicionales |

#### Variantes

| Variante | Descripcion | Uso tipico |
|----------|-------------|------------|
| `text` | Barra rectangular animada | Parrafos, titulos, datos |
| `circle` | Circulo centrado | Iconos, indicadores |
| `avatar` | Cuadrado redondeado (40x40) | Fotos de perfil |
| `button` | Rectangulo con forma de boton | Botones de accion |
| `card` | Card vacia con titulo + lineas | Tarjetas KPI, stat cards |
| `row` | Avatar + 2 lineas en fila | Listas de usuarios |
| `table` | Header + N filas de celdas | Tablas de datos |

#### Ejemplo basico

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

<Skeleton />                          // Texto basico
<Skeleton variant="avatar" />         // Avatar
<Skeleton variant="card" />           // Tarjeta
<Skeleton variant="table" lines={5} /> // Tabla
```

#### Ejemplo avanzado

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

// Estado de carga para una lista de trabajadores
<div className="space-y-3">
  <Skeleton variant="row" />
  <Skeleton variant="row" />
  <Skeleton variant="row" />
</div>

// Grid de tarjetas KPI
<div className="grid grid-cols-3 gap-4">
  <Skeleton variant="card" />
  <Skeleton variant="card" />
  <Skeleton variant="card" />
</div>

// Tabla de datos
<Skeleton variant="table" lines={8} />
```

#### Cuando usar

- Antes de que los datos se carguen en tablas, listas o tarjetas.
- Para dar sensacion de rapidez al usuario (perceived performance).
- Junto con `DataTable` cuando `loading={true}`.

#### No usar cuando

- No usar para contenido que ya esta cargado — es solo para estados de carga.
- No abusar de variantes en la misma vista — elegir la mas representativa.

---

### 4.6 SkeletonText

Placeholder especializado para texto. Mas flexible que `Skeleton variant="text"` porque permite controlar el ancho de cada linea, el ancho de la ultima linea y el espaciado.

**Archivo:** `src/components/ui/SkeletonText/SkeletonText.tsx`

**Importacion:**
```tsx
import { SkeletonText } from '@/components/ui/SkeletonText';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `lines` | `number` | `3` | Numero de lineas |
| `width` | `'full' \| 'random' \| string[]` | `'full'` | Ancho de las lineas |
| `lastLineWidth` | `string` | `undefined` | Ancho de la ultima linea |
| `variant` | `'text' \| 'title'` | `'text'` | Altura de las lineas |
| `gap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Espaciado entre lineas |
| `noAnimation` | `boolean` | `false` | Desactivar animacion pulse |

#### Ejemplos

**Texto basico:**

```tsx
<SkeletonText lines={3} />
```

**Anchos aleatorios:**

```tsx
<SkeletonText lines={4} width="random" />
```

**Anchos personalizados por linea:**

```tsx
<SkeletonText
  lines={3}
  width={['w-full', 'w-3/4', 'w-1/2']}
/>
```

**Titulo con ultima linea corta:**

```tsx
<SkeletonText
  lines={2}
  variant="title"
  lastLineWidth="w-1/3"
/>
```

#### Cuando usar

- Para parrafos de carga con control visual detallado.
- Cuando se necesita simular texto realista con lineas de diferentes anchos.
- Para titulos con subtitulos en estados de carga.

#### No usar cuando

- Se necesita un esqueleto complejo (avatar + texto + boton) — usar `Skeleton variant="row"`.
- Se necesita una tabla o card completa — usar `Skeleton`.

---

## 5. Componentes de Datos

### 5.1 DataTable

Tabla de datos generica con scroll horizontal/vertical, header sticky, headers naranja alternados y columnas adaptables al contenido.

**Archivos:**
- `src/components/ui/DataTable/DataTable.tsx` — Componente principal
- `src/components/ui/DataTable/DataTable.styles.ts` — Clases de estilos
- `src/components/ui/DataTable/index.ts` — Re-exports

**Importacion:**
```tsx
import { DataTable, type Column } from '@/components/ui/DataTable';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `columns` | `Column<T>[]` | *(requerido)* | Definicion de columnas |
| `data` | `T[]` | *(requerido)* | Datos a mostrar |
| `keyExtractor` | `(item: T) => string` | *(requerido)* | Funcion para obtener la key unica de cada fila |
| `loading` | `boolean` | `false` | Muestra skeleton de carga |
| `emptyText` | `string` | `'No hay registros'` | Texto cuando no hay datos |
| `onRowClick` | `(item: T) => void` | `undefined` | Callback al hacer click en una fila |
| `maxBodyHeight` | `string` | `'400px'` | Altura maxima del body con scroll vertical |
| `className` | `string` | `undefined` | Clases adicionales del container |

#### Tipo Column<T>

```ts
interface Column<T> {
  key: string;                              // Clave del campo en el objeto
  header: string;                           // Texto del encabezado
  render?: (item: T) => React.ReactNode;    // Renderizado custom de celda
  className?: string;                       // Clases adicionales
  align?: 'left' | 'center' | 'right';     // Alineacion del contenido de la celda
  minWidth?: string;                        // Ancho minimo (ej: '120px')
  nowrap?: boolean;                         // No romper contenido
}
```

#### Headers Naranja Alternados

Los headers usan el color de marca naranja alternando entre dos tonos:

| Posicion | Fondo | Clase |
|----------|-------|-------|
| Impar (1, 3, 5...) | `#f97316` | `bg-primary` |
| Par (2, 4, 6...) | `#ea580c` | `bg-primary-dark` |

- **Todos los headers centrados** — incluyendo la columna de Acciones.
- **Texto blanco** en todos los headers (`text-white`).
- **`z-20`** en `<thead>` — evita que el contenido se sobreponga al header al hacer scroll.

#### Arquitectura de Scroll

```
┌─── container (rounded-xl border bg-white) ──────────────┐
│ ┌─── overflow-auto (H + V) ───────────────────────────┐ │
│ │                                                      │ │
│ │  ┌─── thead (sticky top-0 z-20) ─────────────────┐  │ │
│ │  │  NOM (naranja) │ PUE (oscuro) │ RFC (naranja) │  │ │
│ │  └────────────────────────────────────────────────┘  │ │
│ │                                                      │ │
│ │  ┌─── tbody (scroll vertical) ────────────────────┐  │ │
│ │  │  Carlos    │ Operador  │ HERC85...  │ ...      │  │ │
│ │  │  Maria     │ Tecnico   │ LOPM90...  │ ...      │  │ │
│ │  │  Juan      │ Supervis  │ PEPJ75...  │ ...      │  │ │
│ │  └────────────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

#### Reglas Criticas

1. **UNA sola tabla** (`<table>`) — header y body comparten el mismo layout de columnas (siempre alineados).
2. **`table-layout: auto`** — el navegador calcula el ancho de columna basado en el contenido, no al reves.
3. **`overflow: auto`** en el wrapper — un solo scroll para ambas direcciones (H + V).
4. **`sticky top-0 z-20`** en `<thead>` — header se queda fijo al hacer scroll vertical, con z-index alto para evitar overlap.
5. **`whitespace-nowrap`** en celdas — el contenido nunca se rompe, cada columna mantiene su texto completo.
6. **Zona segura** — `px-4` (16px) de padding en cada celda, contenido siempre centrado.
7. **Headers siempre centrados** — incluyendo la columna de Acciones.
8. **Naranja solido** — headers con fondo `primary` o `primary-dark` alternado, texto blanco.

#### Estados

| Estado | Descripcion |
|--------|-------------|
| **Loading** | Muestra 5 filas de skeleton animadas (`animate-pulse bg-slate-200`) |
| **Vacio** | Muestra `emptyText` centrado con padding |
| **Con datos** | Renderiza la tabla con filas alternas (white / slate-50/30) |

#### Diseno visual

- Container: `rounded-xl border border-slate-200 bg-white`
- Header: fondo naranja alternado (`primary` / `primary-dark`), texto blanco uppercase, `text-[10px] font-black`, `tracking-widest`, `text-center`
- Filas: bordes `slate-100`, alternating rows (even/odd)
- Filas interactivas: `hover:bg-slate-50/80 cursor-pointer`
- Celdas: `px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap`

#### Ejemplo basico

```tsx
import { DataTable, type Column } from '@/components/ui/DataTable';

interface Trabajador {
  id: string;
  nombre: string;
  puesto: string;
}

const columns: Column<Trabajador>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'puesto', header: 'Puesto' },
];

<DataTable<Trabajador>
  columns={columns}
  data={trabajadores}
  keyExtractor={(t) => t.id}
/>
```

#### Ejemplo avanzado — 10 columnas con acciones

```tsx
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Eye, PencilLine, Trash2 } from 'lucide-react';

interface TrabajadorRow {
  id: string;
  nombre: string;
  puesto: string;
  telefono: string;
  rfc: string;
  sueldoFiscal: number;
  sueldoEfectivo: number;
  fechaIngreso: string;
  bodega: string;
  estado: string;
}

const columns: Column<TrabajadorRow>[] = [
  { key: 'nombre', header: 'Nombre Completo', minWidth: '200px' },
  { key: 'puesto', header: 'Puesto', minWidth: '130px' },
  { key: 'telefono', header: 'Telefono', minWidth: '130px', nowrap: true },
  { key: 'rfc', header: 'RFC', minWidth: '140px', nowrap: true },
  {
    key: 'sueldoFiscal',
    header: 'Sueldo Fiscal',
    minWidth: '130px',
    align: 'right',
    nowrap: true,
    render: (row) => (
      <span className="font-semibold text-slate-800">
        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.sueldoFiscal)}
      </span>
    ),
  },
  {
    key: 'sueldoEfectivo',
    header: 'Sueldo Efectivo',
    minWidth: '130px',
    align: 'right',
    nowrap: true,
    render: (row) => (
      <span className="font-semibold text-green-600">
        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.sueldoEfectivo)}
      </span>
    ),
  },
  { key: 'fechaIngreso', header: 'Fecha Ingreso', minWidth: '120px', nowrap: true },
  { key: 'bodega', header: 'Bodega', minWidth: '140px' },
  {
    key: 'estado',
    header: 'Estado',
    minWidth: '110px',
    render: (row) => (
      <Badge
        variant={row.estado === 'Activo' ? 'success' : row.estado === 'Inactivo' ? 'error' : 'warning'}
        dot
      >
        {row.estado}
      </Badge>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    minWidth: '220px',
    nowrap: true,
    render: () => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="info" size="sm" icon={<Eye size={14} />}>
          Ver
        </Button>
        <Button variant="warning" size="sm" icon={<PencilLine size={14} />}>
          Editar
        </Button>
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />}>
          Eliminar
        </Button>
      </div>
    ),
  },
];

// Tabla completa con scroll vertical
<DataTable<TrabajadorRow>
  columns={columns}
  data={trabajadores}
  keyExtractor={(w) => w.id}
  onRowClick={(w) => console.log('Clicked:', w.nombre)}
  maxBodyHeight="400px"
/>

// Con paginacion
<DataTable<TrabajadorRow>
  columns={columns}
  data={currentRows}
  keyExtractor={(w) => w.id}
/>
<Pagination
  currentPage={3}
  totalPages={10}
  totalRecords={98}
  pageSize={10}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

#### Cuando usar

- Listas de datos tabulares (trabajadores, maquinaria, proyectos, etc.).
- Cualquier vista que requiera mostrar registros en formato de tabla.
- Datos que necesitan renderizado custom en celdas (badges, botones de accion, moneda).
- Tablas con muitas columnas que necesitan scroll horizontal.
- Tablas largas que necesitan scroll vertical con header fijo.

#### No usar cuando

- No usar para listas simples sin columnas — usar un `<ul>` con estilos.
- No usar para datos que no son tabulares — usar cards o listas.
- No abusar de `render` en todas las columnas — solo usarlo cuando el default `String(value)` no es suficiente.
- No usar `minWidth` excesivamente grande — el contenido debe definir el ancho, no al reves.
- No usar sin `keyExtractor` — cada fila necesita una key unica.

---

### 5.2 Pagination

Componente de paginacion para tablas de datos. Muestra info de pagina actual, registros visibles y controles de navegacion.

**Archivos:**
- `src/components/ui/Pagination/Pagination.tsx` — Componente principal
- `src/components/ui/Pagination/Pagination.styles.ts` — Clases de estilos
- `src/components/ui/Pagination/index.ts` — Re-exports

**Importacion:**
```tsx
import { Pagination } from '@/components/ui/Pagination';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `currentPage` | `number` | *(requerido)* | Pagina actual (1-based) |
| `totalPages` | `number` | *(requerido)* | Total de paginas |
| `totalRecords` | `number` | *(requerido)* | Total de registros |
| `pageSize` | `number` | *(requerido)* | Registros por pagina |
| `onPageChange` | `(page: number) => void` | *(requerido)* | Callback al cambiar de pagina |
| `showJumpButtons` | `boolean` | `true` | Mostrar botones de salto inicio/fin |
| `className` | `string` | `undefined` | Clases adicionales del container |

#### Visual

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Pagina 3 de 10 — Mostrando 21-30 de 98 registros     «  ‹  1  2  [3]  4  5  ...  10  ›  »  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Elemento | Icono | Funcion |
|----------|-------|---------|
| `«` | `ChevronsLeft` | Saltar a primera pagina |
| `‹` | `ChevronLeft` | Pagina anterior |
| `1 2 [3] 4 5 ... 10` | — | Numeros de pagina (con ellipsis) |
| `›` | `ChevronRight` | Pagina siguiente |
| `»` | `ChevronsRight` | Saltar a ultima pagina |

#### Diseno visual

- Container: `flex items-center justify-between`, `border-t border-slate-100`, `rounded-b-xl` (se pega al fondo de DataTable)
- Info: `text-sm text-slate-500`, numeros resaltados en `font-semibold text-slate-700`
- Botones: `h-8 min-w-[32px] rounded-lg`
- Boton activo: `bg-primary text-white shadow-sm`
- Boton disabled: `text-slate-300 cursor-not-allowed`
- Gap de ellipsis: `text-slate-400`

#### Ejemplo basico

```tsx
import { Pagination } from '@/components/ui/Pagination';

<Pagination
  currentPage={1}
  totalPages={10}
  totalRecords={98}
  pageSize={10}
  onPageChange={(page) => console.log('Page:', page)}
/>
```

#### Ejemplo avanzado — Con DataTable

```tsx
import { useState } from 'react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';

function TrabajadoresPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Calcular datos de la pagina actual
  const allData = getTrabajadores(); // API call
  const totalPages = Math.ceil(allData.length / pageSize);
  const currentRows = allData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <DataTable<Trabajador>
        columns={columns}
        data={currentRows}
        keyExtractor={(t) => t.id}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={allData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
```

#### Cuando usar

- Tablas con mas de 10-20 registros que necesitan paginacion.
- Cualquier lista de datos donde se quiera controlar la cantidad de registros visibles.
- Junto con `DataTable` para CRUDs con muchos registros.

#### No usar cuando

- No usar para listas cortas (menos de 10 registros) — mostrar todos directamente.
- No usar sin conectar a estado — el componente es controlado (`currentPage` + `onPageChange`).
- No usar dentro de un `Card` con `overflow-hidden` — el padding inferior puede cortarse.

---

## 6. Componentes de Sistema

Estos componentes son esenciales para la arquitectura de la aplicacion. Los modales estan en `src/components/ui/Modal/` y los providers de notificaciones en `src/components/layout/`.

### 6.1 Modal

Modal base con overlay, header, contenido scrollable y footer de acciones. Usa los componentes `Portal` y `Overlay` para renderizar fuera del DOM y manejar el backdrop. Compone sub-componentes (`ModalHeader`, `ModalBody`, `ModalFooter`) para flexibilidad total.

**Archivo:** `src/components/ui/Modal/Modal.tsx`

**Importacion:**
```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `open` | `boolean` | *(requerido)* | Controla la visibilidad del modal |
| `onClose` | `() => void` | *(requerido)* | Callback al cerrar (Escape, overlay, boton) |
| `children` | `React.ReactNode` | *(requerido)* | Contenido del modal (componer con ModalHeader/Body/Footer) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Tamano maximo del modal |
| `persistent` | `boolean` | `false` | Si es true, no cierra al hacer click en overlay ni con Escape |
| `contentClassName` | `string` | `undefined` | Clases adicionales para el card interno |
| `offsetLeft` | `number` | `0` | Omite el overlay en los primeros pixeles del lado izquierdo (util para no cubrir el sidebar) |

#### Sub-componentes

**ModalHeader:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `title` | `string` | *(requerido)* | Titulo del modal |
| `subtitle` | `string` | `undefined` | Subtitulo descriptivo |
| `onClose` | `() => void` | `undefined` | Callback del boton cerrar |
| `hideClose` | `boolean` | `false` | Ocultar boton X |

**ModalBody:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | *(requerido)* | Contenido scrollable |
| `className` | `string` | `undefined` | Clases adicionales |

**ModalFooter:**

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | *(requerido)* | Botones de accion |
| `className` | `string` | `undefined` | Clases adicionales |

#### Tamanos

| Tamano | Max-width | Uso tipico |
|--------|-----------|------------|
| `sm` | `max-w-sm` (384px) | Confirmaciones, alertas simples |
| `md` | `max-w-md` (448px) | Formularios cortos |
| `lg` | `max-w-lg` (512px) | Formularios completos |
| `xl` | `max-w-xl` (576px) | Formularios extensos |
| `full` | `max-w-3xl` (768px) | Vistas complejas, previews |

#### Funcionalidades

- Renderiza en un `Portal` fuera del arbol DOM principal.
- Usa el componente `Overlay` para el backdrop con blur.
- Cierra con tecla `Escape` (excepto `persistent`).
- Cierra al hacer click en el overlay (excepto `persistent`).
- Bloquea scroll del body mientras esta abierto.
- Animacion de entrada con `fadeScaleIn`.
- Accesibilidad: `role="dialog"`, `aria-modal="true"`.

#### Ejemplo basico

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

<Modal open={open} onClose={() => setOpen(false)} size="md">
  <ModalHeader title="Detalle del Trabajador" onClose={() => setOpen(false)} />
  <ModalBody>
    <p className="text-sm text-slate-600">Contenido del modal aqui...</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cerrar</Button>
    <Button>Aceptar</Button>
  </ModalFooter>
</Modal>
```

#### Ejemplo: Modal de confirmacion (sin header)

```tsx
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Trash2 } from 'lucide-react';

<Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} size="sm">
  <ModalBody>
    <div className="flex flex-col items-center text-center py-2">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Eliminar Registro</h3>
      <p className="text-sm text-slate-500 mt-1">
        Esta accion es permanente.
      </p>
    </div>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
    <Button variant="danger" icon={<Trash2 size={16} />}>Eliminar</Button>
  </ModalFooter>
</Modal>
```

---

### 6.2 FormModal

Modal pre-armado para flujos CRUD. Incluye header con titulo/subtitulo, body con formulario scrollable, y footer con botones Cancelar/Guardar. Simplifica la creacion de modales con formulario.

**Archivo:** `src/components/ui/Modal/FormModal.tsx`

**Importacion:**
```tsx
import { FormModal } from '@/components/ui/Modal';
```

#### Props (hereda de Modal)

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `title` | `string` | *(requerido)* | Titulo del modal |
| `subtitle` | `string` | `undefined` | Subtitulo descriptivo |
| `children` | `React.ReactNode` | *(requerido)* | Contenido del formulario |
| `submitLabel` | `string` | `'Guardar'` | Texto del boton de envio |
| `cancelLabel` | `string` | `'Cancelar'` | Texto del boton de cancelar |
| `onSubmit` | `() => void` | `undefined` | Callback al enviar el formulario |
| `isSubmitting` | `boolean` | `false` | Estado de carga del boton guardar |
| `submitDisabled` | `boolean` | `false` | Deshabilitar boton guardar |
| `hideFooter` | `boolean` | `false` | Ocultar footer con botones |
| `onCancel` | `() => void` | `undefined` | Alias para onClose |

*Tambien acepta todas las props de `Modal` (`open`, `onClose`, `size`, `persistent`, etc.)*

#### Ejemplo basico

```tsx
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';

<FormModal
  open={open}
  onClose={() => setOpen(false)}
  title="Nuevo Trabajador"
  subtitle="Completa los datos para registrar un nuevo trabajador"
  submitLabel="Guardar Trabajador"
  onSubmit={handleSave}
  isSubmitting={saving}
  size="lg"
>
  <div className="grid grid-cols-2 gap-4">
    <ModalField label="Nombre" required>
      <input className={modalInputClass} placeholder="Nombre completo" />
    </ModalField>
    <ModalField label="Puesto" required>
      <select className={modalSelectClass}>
        <option value="">Seleccionar...</option>
        <option value="operador">Operador</option>
      </select>
    </ModalField>
  </div>
</FormModal>
```

---

### 6.3 ModalField

Wrapper de campo de formulario para modales. Incluye label, indicador de requerido, hint de ayuda y mensaje de error.

**Archivo:** `src/components/ui/Modal/ModalField.tsx`

**Importacion:**
```tsx
import { ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
```

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `label` | `string` | *(requerido)* | Texto del label |
| `required` | `boolean` | `false` | Muestra asterisco rojo |
| `hint` | `string` | `undefined` | Texto de ayuda debajo del campo |
| `error` | `string` | `undefined` | Mensaje de error (reemplaza hint) |
| `children` | `React.ReactNode` | *(requerido)* | Input/select/textarea |
| `className` | `string` | `undefined` | Clases adicionales |

#### Clases de inputs exportadas

| Clase | Uso | Estilo |
|-------|-----|--------|
| `modalInputClass` | `<input>` | `h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm` |
| `modalSelectClass` | `<select>` | Igual + `appearance-none pr-10` |
| `modalTextareaClass` | `<textarea>` | Igual + `py-3 resize-none` |

#### Ejemplo

```tsx
import { ModalField, modalInputClass } from '@/components/ui/Modal';

// Campo basico
<ModalField label="Nombre" required>
  <input className={modalInputClass} placeholder="Nombre completo" />
</ModalField>

// Campo con error
<ModalField label="RFC" error="El RFC debe tener 13 caracteres">
  <input className={modalInputClass} maxLength={13} />
</ModalField>

// Campo con hint
<ModalField label="Sueldo Fiscal" hint="Monto mensual antes de deducciones">
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
    <input className={modalInputClass + ' pl-8'} type="number" placeholder="0.00" />
  </div>
</ModalField>
```

> **Nota:** Los `modalInputClass`/`modalSelectClass`/`modalTextareaClass` son estilos consistenes para campos dentro de modales. Para campos fuera de modales, usar los componentes `Input` y `Select` del catalogo UI.

---

### 6.4 Toast

Sistema completo de notificaciones con 6 posiciones, 4 tipos y 7 transiciones. Incluye barra de progreso, pausa al hover y auto-dismiss.

**Archivos:**
- `src/components/layout/Toast.tsx` — Provider + Componente
- `src/components/layout/Toast.types.ts` — Tipos TypeScript
- `src/components/layout/Toast.styles.ts` — Clases de posicion y animacion

**Importacion:**
```tsx
import { useToast } from '@/components/layout/Toast';
```

#### API del hook

```ts
const { showToast, success, error, warning, info, dismiss, dismissAll } = useToast();

// Metodos abreviados (mismo efecto que showToast)
success('Trabajador guardado', { position: 'top-right', transition: 'bounceIn' });
error('Error al eliminar', { position: 'bottom-left' });
warning('Campos vacios', { position: 'top-center' });
info('Datos actualizados', { position: 'bottom-right' });

// Metodo generico
showToast('Mensaje', 'success', { position, transition, duration, progress });

// Control manual
dismiss(id);     // Cerrar un toast especifico
dismissAll();    // Cerrar todos
```

#### Posiciones

| Posicion | Descripcion |
|----------|-------------|
| `top-left` | Esquina superior izquierda |
| `top-center` | Centro superior |
| `top-right` | Esquina superior derecha (default) |
| `bottom-left` | Esquina inferior izquierda |
| `bottom-center` | Centro inferior |
| `bottom-right` | Esquina inferior derecha |

#### Tipos de Toast

| Tipo | Icono | Color | Uso en SVR-ERP |
|------|-------|-------|----------------|
| `success` | `CheckCircle2` | Verde | **Crear** registros |
| `warning` | `AlertTriangle` | Amarillo | **Editar** registros |
| `error` | `XCircle` | Rojo | **Eliminar** registros |
| `info` | `Info` | Azul | **Mostrar** informacion |

#### Transiciones

| Transicion | Efecto |
|------------|--------|
| `fadeIn` | Desvanecimiento con desplazamiento suave (default) |
| `bounceIn` | Rebote con escala (elastic bounce) |
| `swingInverted` | Balanceo desde la derecha con rotacion |
| `popUp` | Expansion desde abajo con overshoot |
| `topBounce` | Rebote vertical desde arriba |
| `bounceInDown` | Caida desde arriba con rebote multiple |
| `bounceInUp` | Salto desde abajo con rebote multiple |

#### ToastOptions

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `position` | `ToastPosition` | `'top-right'` | Posicion del contenedor |
| `transition` | `ToastTransition` | `'fadeIn'` | Animacion de entrada |
| `duration` | `number` | `4000` | Duracion en ms (0 = no auto-dismiss) |
| `progress` | `boolean` | `true` | Mostrar barra de progreso |

#### Ejemplo basico

```tsx
import { useToast } from '@/components/layout/Toast';

function MiComponente() {
  const toast = useToast();

  return (
    <Button onClick={() => toast.success('Guardado correctamente')}>
      Guardar
    </Button>
  );
}
```

#### Ejemplo avanzado

```tsx
const toast = useToast();

// Toast de exito con posicion y transicion personalizadas
toast.success('Trabajador creado', {
  position: 'top-center',
  transition: 'bounceIn',
  duration: 5000,
  progress: true,
});

// Toast de error sin auto-dismiss
toast.error('Error critico del servidor', {
  position: 'bottom-center',
  transition: 'swingInverted',
  duration: 0,  // No se cierra solo
});

// Lanzar los 4 tipos secuencialmente
toast.success('Creado', { position: 'top-right', transition: 'fadeIn' });
setTimeout(() => toast.warning('Editado', { position: 'top-right', transition: 'bounceIn' }), 200);
setTimeout(() => toast.error('Eliminado', { position: 'top-right', transition: 'popUp' }), 400);
setTimeout(() => toast.info('Informacion', { position: 'top-right', transition: 'topBounce' }), 600);
```

#### Funcionalidades

- **Barra de progreso**: Muestra tiempo restante visualmente.
- **Pausa al hover**: Se detiene cuando el mouse esta sobre el toast.
- **Posiciones multiples**: 6 posiciones, cada una renderiza su propio contenedor.
- **7 transiciones**: Animaciones CSS con cubic-bezier para efectos suaves.
- **Colores semanticos**: Verde (crear), Amarillo (editar), Rojo (eliminar), Azul (info).
- **Dismiss manual**: Boton X o llamada a `dismiss(id)`.
- **Close con Escape**: Opcional, configurable.

---

### 6.5 NotificationContext

Contexto para el centro de alertas/notificaciones del Topbar. Provee estado global de notificaciones con operaciones CRUD basicas.

**Archivo:** `src/components/layout/NotificationContext.tsx`

**Importacion:**
```tsx
import { useNotifications } from '@/components/layout/NotificationContext';
```

#### API del hook

```ts
const {
  notifications,      // Notification[]
  unreadCount,        // number
  addNotification,    // (notif: Omit<Notification, 'id' | 'fecha' | 'leido'>) => void
  markAsRead,         // (id: string) => void
  markAllAsRead,      // () => void
  clearNotifications, // () => void
} = useNotifications();
```

#### Tipo Notification

```ts
interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'alerta' | 'info' | 'correo';
  fecha: string;
  leido: boolean;
  destinatario?: string;
  asunto?: string;
  plantillaHtml?: string;
}
```

---

## 7. Guia de Estilos

### 7.1 Patron de Estilos Separados

Todos los componentes UI siguen el patron **estilos separados**:

```
Componente/
  Componente.tsx        # Logica y JSX
  Componente.styles.ts  # Objeto de clases Tailwind
  index.ts              # Re-exports
```

**Beneficios:**
- Separacion clara entre logica y presentacion.
- Los estilos se pueden inspectar/importar independientemente.
- Facilita el refactoring de estilos sin tocar la logica.
- El objeto de estilos es un contrato visual claro y documentado.

**Regla:** Nunca colocar clases de Tailwind directamente en el JSX del componente cuando son parte del diseno base. Siempre van en el archivo `.styles.ts`.

Excepciones: clases condicionales dinamicas o clases que vienen del consumidor via `className`.

### 7.2 Convenciones de Nomenclatura

| Elemento | Convencion | Ejemplo |
|----------|-----------|---------|
| Objeto de estilos | `{nombre}Classes` | `buttonClasses`, `cardClasses` |
| Keys del objeto | camelCase descriptivo | `base`, `variants`, `sizes`, `disabled` |
| Variantes | Nombres semanticos | `primary`, `success`, `danger` |
| Tamanos | `sm`, `md`, `lg` | `sm: 'h-8 ...'` |
| Interfaces | `{Nombre}Props` | `ButtonProps`, `CardProps` |
| Types | `{Nombre}{Propiedad}` | `ButtonVariant`, `ButtonSize` |

### 7.3 Responsive Design

Los componentes UI son responsivos por defecto usando las breakpoints de Tailwind:

- **sm** (640px): Dispositivos moviles grandes
- **md** (768px): Tablets
- **lg** (1024px): Desktop
- **xl** (1280px): Desktop grande

**Patron comun en PageHeader:**
```tsx
// Se apila en moviles, se horizontaliza en desktop
'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
```

**Grid responsivo en paginas:**
```tsx
// 1 col en moviles, 2 en tablets, 4 en desktop
'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
```

---

## Apendice: Paleta Completa de Iconos

Iconos mas utilizados en SVR-ERP (todos de `lucide-react`):

| Icono | Import | Uso tipico |
|-------|--------|------------|
| `Plus` | `import { Plus } from 'lucide-react'` | Agregar registro |
| `Save` | `import { Save } from 'lucide-react'` | Guardar cambios |
| `Trash2` | `import { Trash2 } from 'lucide-react'` | Eliminar |
| `Edit` | `import { Edit } from 'lucide-react'` | Editar registro |
| `Eye` | `import { Eye } from 'lucide-react'` | Ver detalle |
| `Download` | `import { Download } from 'lucide-react'` | Exportar/descargar |
| `Search` | `import { Search } from 'lucide-react'` | Buscar |
| `Filter` | `import { Filter } from 'lucide-react'` | Filtrar |
| `X` | `import { X } from 'lucide-react'` | Cerrar/cancelar |
| `Check` | `import { Check } from 'lucide-react'` | Confirmar/completado |
| `AlertCircle` | `import { AlertCircle } from 'lucide-react'` | Error/alerta |
| `CheckCircle2` | `import { CheckCircle2 } from 'lucide-react'` | Exito |
| `AlertTriangle` | `import { AlertTriangle } from 'lucide-react'` | Advertencia |
| `Loader2` | `import { Loader2 } from 'lucide-react'` | Loading spinner |
| `ChevronDown` | `import { ChevronDown } from 'lucide-react'` | Dropdown |
| `FileSearch` | `import { FileSearch } from 'lucide-react'` | Estado vacio |
| `TrendingUp` | `import { TrendingUp } from 'lucide-react'` | Trend positivo |
| `TrendingDown` | `import { TrendingDown } from 'lucide-react'` | Trend negativo |
| `Users` | `import { Users } from 'lucide-react'` | Personal/trabajadores |
| `Truck` | `import { Truck } from 'lucide-react'` | Maquinaria/flota |
| `HardHat` | `import { HardHat } from 'lucide-react'` | Proyectos |
| `Banknote` | `import { Banknote } from 'lucide-react'` | Finanzas/nomina |
| `Settings` | `import { Settings } from 'lucide-react'` | Configuracion |
| `Bell` | `import { Bell } from 'lucide-react'` | Notificaciones |
| `Mail` | `import { Mail } from 'lucide-react'` | Correo |

---

## 8. Reglas de Espaciado y Zona Segura

**REGLA CRITICA:** Todos los componentes y paginas deben respetar un sistema de espaciado consistente para crear una "zona segura" visual. Esto garantiza que el contenido nunca toque los bordes de la pantalla ni entre si de manera desordenada.

### 8.1 Zona Segura de Pagina

Toda pagina del dashboard debe usar el patron:

```tsx
<div className="p-6 space-y-6 bg-slate-50 min-h-screen">
  <PageHeader ... />
  <section>...</section>
  <section>...</section>
</div>
```

- **`p-6`** (24px): Padding de pagina — el contenido nunca toca los bordes de la pantalla.
- **`space-y-6`** (24px): Separacion entre secciones.
- **`bg-slate-50`**: Fondo consistente en todas las paginas.

### 8.2 Zona Segura de Cards

Las cards internas deben usar:

```tsx
<Card className="space-y-6">     {/* Card con spacing interno */}
  <h2>Titulo</h2>
  <div className="space-y-4">    {/* Contenido */}
    ...
  </div>
</Card>
```

- **`p-6`** o **`padding="md"`** en Card: Padding interno de 24px.
- **`space-y-4`** o **`space-y-6`**: Entre elementos dentro de la card.
- **`gap-4`** o **`gap-6`**: En grids dentro de cards.

### 8.3 Tokens de Spacing (CSS Variables)

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-page` | 24px | Padding de pagina |
| `--spacing-section` | 24px | Entre secciones |
| `--spacing-card` | 24px | Dentro de cards |
| `--spacing-card-sm` | 16px | Card padding sm |
| `--spacing-card-lg` | 32px | Card padding lg |
| `--spacing-inline` | 12px | Entre elementos inline |
| `--spacing-stack` | 16px | Stack vertical |
| `--spacing-stack-sm` | 8px | Stack apretado |
| `--spacing-stack-lg` | 24px | Stack amplio |
| `--spacing-field` | 16px | Entre campos de formulario |
| `--spacing-field-gap` | 6px | Entre label e input |

### 8.4 Sombras

| Clase | Uso |
|-------|-----|
| `shadow-sm` | Cards en reposo, elementos sutiles |
| `shadow-md` | Cards con hover, dropdowns |
| `shadow-lg` | Modales, popovers |
| `shadow-xl` | Modales grandes, overlays |
| `shadow-primary` | Botones primarios, CTAs |

### 8.5 Border Radius

| Clase | Valor | Uso |
|-------|-------|-----|
| `rounded-sm` | 6px | Badges, tags pequenos |
| `rounded-md` | 8px | Inputs, botones sm |
| `rounded-lg` | 12px | Cards, botones |
| `rounded-xl` | 16px | Cards principales, modales |
| `rounded-2xl` | 24px | Modales, paneles |
| `rounded-full` | Infinito | Avatares, botones circulares |

### 8.5 Regla de Oro

> **Todo componente debe tener:** margin/padding suficiente para no pegarse a los bordes de su contenedor, y spacing consistente con los elementos vecinos. Usar `Stack` o `space-y-*` para separacion vertical, y `gap-*` o `Stack direction="horizontal"` para separacion horizontal. **NUNCA** usar valores magicos como `mt-[13px]` o `px-[17px]` — siempre usar los tokens del theme o las clases de Tailwind estandar.

---

## 9. SearchBar + FilterPanel + ActiveFilters

Barra de busqueda con filtros avanzados y chips de filtros activos.

### 9.1 SearchBar

Barra de busqueda con input, boton de filtros y soporte para debounce.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `value` | `string` | — | Valor de busqueda controlado |
| `placeholder` | `string` | `'Buscar...'` | Placeholder del input |
| `onChange` | `(value: string) => void` | — | Callback al cambiar valor |
| `onSearch` | `(value: string) => void` | — | Callback al enviar (Enter) |
| `debounceMs` | `number` | `300` | Tiempo de debounce |
| `filters` | `FilterField[]` | `[]` | Campos de filtro disponibles |
| `activeFilters` | `ActiveFilter[]` | `[]` | Filtros activos |
| `onFilterChange` | `(key, value) => void` | — | Callback al cambiar filtro |
| `onClearFilters` | `() => void` | — | Callback limpiar filtros |
| `onRemoveFilter` | `(key) => void` | — | Callback eliminar filtro |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { SearchBar } from '@/components/ui/SearchBar';
```

#### Ejemplo

```tsx
<SearchBar
  value={search}
  placeholder="Buscar trabajador..."
  onChange={setSearch}
  filters={[
    { key: "puesto", label: "Puesto", type: "select", options: [...] },
    { key: "estado", label: "Estado", type: "select", options: [...] },
  ]}
  activeFilters={activeFilters}
  onRemoveFilter={(key) => removeFilter(key)}
  onClearFilters={() => clearFilters()}
/>
```

### 9.2 FilterPanel

Panel de filtros expandible con selects, fechas y inputs de texto.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `filters` | `FilterField[]` | — | Campos de filtro |
| `values` | `Record<string, string>` | `{}` | Valores actuales |
| `onChange` | `(key, value) => void` | — | Callback al cambiar |
| `onClear` | `() => void` | — | Callback limpiar todo |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { FilterPanel } from '@/components/ui/SearchBar';
```

#### Ejemplo

```tsx
<FilterPanel
  filters={[
    { key: "puesto", label: "Puesto", type: "select", options: [...] },
    { key: "fecha", label: "Fecha", type: "date" },
  ]}
  values={filters}
  onChange={(key, value) => setFilter(key, value)}
  onClear={() => clearFilters()}
/>
```

### 9.3 ActiveFilters

Chips que muestran los filtros activos con boton de eliminar.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `filters` | `ActiveFilter[]` | — | Filtros activos |
| `onRemove` | `(key) => void` | — | Eliminar filtro individual |
| `onClearAll` | `() => void` | — | Limpiar todos |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { ActiveFilters } from '@/components/ui/SearchBar';
```

#### Ejemplo

```tsx
<ActiveFilters
  filters={[
    { key: "puesto", label: "Puesto", value: "Operador" },
    { key: "estado", label: "Estado", value: "Activo" },
  ]}
  onRemove={(key) => removeFilter(key)}
  onClearAll={() => clearFilters()}
/>
```

### 9.4 Cuando usar

- **SearchBar**: Siempre que una tabla o lista necesite busqueda y filtros.
- **FilterPanel**: Cuando hay multiples filtros complejos (selects, fechas).
- **ActiveFilters**: Para mostrar visualmente los filtros aplicados.

### 9.5 No usar cuando

- La lista tiene menos de 5 elementos (no necesita busqueda).
- Los filtros son solo un campo de texto (usar `SearchBar` sin filtros).
- La busqueda es simple y no necesita debounce.

---

## 10. GPS Tracking Components

Componentes para monitoreo en tiempo real de maquinaria de construccion.

### 10.1 GpsMap

Mapa simulado con marcadores de maquinaria, grid de fondo y lineas de carretera SVG.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `machines` | `GpsMachine[]` | — | Lista de maquinas |
| `selectedId` | `string` | — | ID de maquina seleccionada |
| `onSelect` | `(machine) => void` | — | Callback al seleccionar |
| `height` | `string` | `'400px'` | Altura del mapa |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { GpsMap } from '@/components/ui/GpsTracking';
```

#### Ejemplo

```tsx
<GpsMap
  machines={machines}
  selectedId={selectedMachine?.id}
  onSelect={setSelectedMachine}
  height="350px"
/>
```

### 10.2 TrackingPanel

Panel de detalle con velocimetro, combustible, temperatura, horas y operador.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `machine` | `GpsMachine` | — | Maquina a mostrar |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { TrackingPanel } from '@/components/ui/GpsTracking';
```

### 10.3 SpeedGauge

Velocimetro circular que muestra la velocidad actual en km/h.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `speed` | `number` | — | Velocidad actual |
| `maxSpeed` | `number` | `80` | Velocidad maxima |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { SpeedGauge } from '@/components/ui/GpsTracking';
```

### 10.4 MachineList

Lista scrollable de maquinas con badges de estado y seleccion.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `machines` | `GpsMachine[]` | — | Lista de maquinas |
| `selectedId` | `string` | — | ID seleccionada |
| `onSelect` | `(machine) => void` | — | Callback al seleccionar |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { MachineList } from '@/components/ui/GpsTracking';
```

### 10.5 GpsTimeline

Linea de tiempo de actividad con dots y lineas conectoras.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `events` | `TimelineEvent[]` | — | Eventos a mostrar |
| `className` | `string` | — | CSS adicional |

#### Import

```tsx
import { GpsTimeline } from '@/components/ui/GpsTracking';
```

### 10.6 StatusBadge + LiveIndicator

Badges de estado y indicador en vivo.

```tsx
import { StatusBadge, LiveIndicator } from '@/components/ui/GpsTracking';

<LiveIndicator />
<StatusBadge status="moving" />
<StatusBadge status="idle" />
<StatusBadge status="offline" />
<StatusBadge status="alert" />
```

### 10.7 Cuando usar

- **GpsMap**: Para visualizar la ubicacion de maquinaria en tiempo real.
- **TrackingPanel**: Para ver detalles de una maquina especifica.
- **MachineList**: Para listar y seleccionar maquinas.
- **GpsTimeline**: Para historial de actividad de una maquina.
- **SpeedGauge**: Para mostrar velocidad actual de forma visual.

### 10.8 No usar cuando

- La aplicacion no trackea ubicacion en tiempo real.
- Se necesita un mapa real (usar Leaflet/Mapbox en su lugar).
- Los datos son estaticos (no cambian en tiempo real).

---

## 11. Charts - Visualizacion de Datos

Las graficas se implementan con la libreria **Recharts** para React/Next.js. Los wrappers en `apps/web/src/components/ui/Charts/` encapsulan la complejidad y aplican el diseno del sistema.

### 11.0 Libreria Recharts

```bash
cd apps/web
npm install recharts
```

Por que Recharts:
- API declarativa basada en componentes JSX.
- Funciona perfectamente con Next.js 16 y React 19.
- Bundle razonable para dashboards ERP.
- Facil de personalizar con Tailwind CSS.
- Mas popular y mantenida que alternativas como Chart.js o Nivo.

### 11.1 BarChart

Grafica de barras verticales con grid, labels y tooltips.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `data` | `ChartDataPoint[]` | — | Datos a graficar |
| `title` | `string` | — | Titulo de la grafica |
| `subtitle` | `string` | — | Subtitulo |
| `height` | `number` | `250` | Altura en px |
| `showGrid` | `boolean` | `true` | Mostrar lineas de grid |
| `showLabels` | `boolean` | `true` | Mostrar labels en eje X |
| `showLegend` | `boolean` | `false` | Mostrar leyenda |

#### Import

```tsx
import { BarChart } from '@/components/ui/Charts';
```

#### Ejemplo

```tsx
<BarChart
  title="Produccion Mensual"
  data={[
    { label: 'Ene', value: 120 },
    { label: 'Feb', value: 85 },
    { label: 'Mar', value: 145 },
  ]}
  height={200}
  showLegend
/>
```

### 11.2 LineChart

Grafica de lineas con multiples series.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `labels` | `string[]` | — | Labels del eje X |
| `series` | `MultiSeriesData[]` | — | Series de datos |
| `title` | `string` | — | Titulo |
| `subtitle` | `string` | — | Subtitulo |
| `height` | `number` | `250` | Altura en px |
| `showGrid` | `boolean` | `true` | Mostrar grid |
| `showLegend` | `boolean` | `true` | Mostrar leyenda |

#### Import

```tsx
import { LineChart } from '@/components/ui/Charts';
```

#### Ejemplo

```tsx
<LineChart
  title="Ingresos vs Egresos"
  labels={['Ene', 'Feb', 'Mar', 'Abr']}
  series={[
    { name: 'Ingresos', data: [45, 52, 38, 65] },
    { name: 'Egresos', data: [30, 35, 28, 42] },
  ]}
/>
```

### 11.3 AreaChart

Grafica de area con relleno semitransparente.

#### Props

Misma estructura que `LineChart`.

#### Import

```tsx
import { AreaChart } from '@/components/ui/Charts';
```

### 11.4 PieChart

Grafica circular con porcentajes visibles.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `data` | `ChartDataPoint[]` | — | Datos |
| `title` | `string` | — | Titulo |
| `height` | `number` | `250` | Altura |
| `showLegend` | `boolean` | `true` | Leyenda |

#### Import

```tsx
import { PieChart } from '@/components/ui/Charts';
```

### 11.5 DoughnutChart

Grafica de dona con total centrado.

#### Import

```tsx
import { DoughnutChart } from '@/components/ui/Charts';
```

### 11.6 RadarChartComponent

Grafica de radar para comparar multiples variables en una dimension radial.

#### Import

```tsx
import { RadarChartComponent } from '@/components/ui/Charts';
```

#### Ejemplo

```tsx
<RadarChartComponent
  title="Metricas del Equipo"
  data={[
    { label: 'Velocidad', value: 85 },
    { label: 'Eficiencia', value: 72 },
    { label: 'Seguridad', value: 95 },
    { label: 'Calidad', value: 68 },
  ]}
/>
```

### 11.7 ScatterChartComponent

Grafica de puntos para correlaciones.

#### Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `points` | `ScatterPoint[]` | — | Puntos (x, y, label?) |
| `title` | `string` | — | Titulo |
| `height` | `number` | `250` | Altura |

#### Import

```tsx
import { ScatterChartComponent } from '@/components/ui/Charts';
```

### 11.8 RadialBarChartComponent

Barras radiales circulares concentricas.

#### Import

```tsx
import { RadialBarChartComponent } from '@/components/ui/Charts';
```

### 11.9 Colores por Defecto

```
#ed8238  #3d9b6e  #557fb5  #d4963a  #c75450
#8b5cf6  #ec4899  #14b8a6  #f97316  #6366f1
```

Cada punto de datos puede tener un `color` custom.

### 11.10 Cuando usar

- **BarChart**: Comparar cantidades entre categorias.
- **LineChart**: Tendencias a lo largo del tiempo.
- **AreaChart**: Volumen acumulado o tendencia con relleno.
- **PieChart**: Proporciones de un total (pocas categorias).
- **DoughnutChart**: Proporciones con total visible.
- **RadarChartComponent**: Comparar categorias con dimension radial.
- **ScatterChartComponent**: Correlacion entre dos variables.
- **RadialBarChartComponent**: Metas o progreso circular.

### 11.11 Cursor del Tooltip

Para evitar lineas negras/artefactos visuales al pasar el mouse sobre las graficas, el cursor del tooltip esta configurado con un estilo gris punteado:

```tsx
const tooltipProps = {
  cursor: { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' },
};
```

No usar el cursor por defecto de Recharts porque puede generar artefactos visuales en navegadores con aceleracion de GPU.

### 11.12 No usar cuando

- Mas de 10 categorias en Pie/Doughnut (usar BarChart).
- Datos negativos en Pie/Doughnut/Polar (usar Line/Bar).
- Series con mas de 5 lineas (usar legend select).

---

## 12. Reglas de Overflow Protection

Todos los componentes UI protegen contra desbordamiento de contenido.

### 12.1 Patron General

| Proteccion | Clase CSS | Uso |
|------------|-----------|-----|
| **Recortar contenido** | `overflow-hidden` | Containers que no deben crecer |
| **Truncar texto** | `truncate` | Texto largo que debe cortarse con `...` |
| **Romper palabras** | `break-words` | Texto largo que debe saltar de linea |
| **Minimo ancho** | `min-w-0` | Flex children que pueden crecer indefinidamente |
| **No encoger** | `shrink-0` | Elementos que no deben cambiar de tamano |

### 12.2 Componentes Protegidos

| Componente | Proteccion Aplicada |
|------------|---------------------|
| **Card** | `overflow-hidden` en base |
| **StatsCard** | `overflow-hidden` + `truncate` en value/label |
| **PageHeader** | `min-w-0 flex-1` en titulo + `truncate` |
| **Badge** | `overflow-hidden max-w-full` |
| **Button** | `overflow-hidden min-w-0` + `truncate` en children |
| **EmptyState** | `overflow-hidden` + `break-words` |
| **Modal** | `max-h-[90vh]` + `overflow-y-auto` en body |
| **DataTable** | `overflow-auto` en scroll container |
| **Tabs** | `overflow-x-auto` en tab list |
| **GpsTracking** | `min-w-0 truncate` en panel values |

### 12.3 Regla de Oro

> **TODO componente debe evitar que el texto o contenido salga de sus limites.** Usar `overflow-hidden` en containers, `truncate` en texto de una sola linea, `break-words` en texto multilinea, `min-w-0` en flex children, y `shrink-0` en iconos/badges que no deben cambiar de tamano. El contenido se desplaza o trunca en lugar de romper el layout.
