import { cn } from '@/lib/utils';
import { buttonClasses } from '@/components/ui/Button';

/** Estilos de la tarjeta de máquina PWA ("Flota y obras") — aplicados con cn(). Mismo lenguaje que TarjetaReporte. */
export const tarjetaMaquinaClasses = {
  root: 'bg-surface border border-ui-200 rounded-2xl p-4 shadow-sm',
  header: 'flex items-start justify-between gap-2',
  titulo: 'min-w-0',
  nombre: 'text-base font-black tracking-tight text-ui-900 break-words',
  subtitulo: 'text-[11px] font-bold uppercase tracking-wide text-ui-500 truncate',
  badge: 'shrink-0',
  linea: 'mt-2 text-sm text-ui-700 break-words',
  lineaSecundaria: 'mt-0.5 text-sm text-ui-600 break-words',
  etiqueta: 'font-bold text-ui-900',
  vacio: 'text-ui-500',
  pie: 'mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ui-100 pt-3',
  gps: 'text-[11px] text-ui-500 min-w-0',
  // warning-dark en claro: el warning normal (#d4963a) sobre blanco no da contraste para texto chico.
  gpsSinSenal: 'text-[11px] font-bold text-warning-dark dark:text-warning min-w-0',
};

/**
 * Liga al mapa con cara de botón secundario (≥44 px). Exportada: la usa también el encabezado de cada obra en
 * /m/flota-obras, para que las dos ligas se vean igual.
 */
export const enlaceMapaClase = cn(
  buttonClasses.base,
  buttonClasses.variants.secondary,
  buttonClasses.sizes.md,
  'min-h-[44px] shrink-0',
);
