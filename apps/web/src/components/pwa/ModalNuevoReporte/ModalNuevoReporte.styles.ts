/** Estilos del modal de nuevo reporte PWA — aplicados con cn(). */
export const modalNuevoReporteClasses = {
  /** Select nativo del ÁREA (el kit Select no soporta optgroups; igual que el escritorio). */
  selectArea:
    'w-full min-h-[44px] rounded-xl border border-ui-200 bg-surface px-3 text-sm text-ui-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
  toggle: 'flex gap-2 mb-2',
  toggleBtn:
    'flex-1 min-h-[44px] rounded-xl text-xs font-bold transition-colors',
  toggleActivo: 'bg-primary text-white',
  toggleInactivo: 'bg-ui-100 text-ui-500',
  notaGps:
    'flex items-center gap-2 min-h-[44px] px-3 border border-ui-200 rounded-xl bg-ui-50 text-xs font-medium text-ui-500',
  notaExito:
    'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300 rounded-xl p-3 text-sm',
  agregar:
    'inline-flex items-center gap-1.5 text-xs font-bold text-primary cursor-pointer hover:text-primary-dark',
  gridImagenes: 'grid grid-cols-2 gap-2 mt-2',
  imagen: 'relative rounded-xl overflow-hidden border border-ui-200 bg-ui-50',
  imagenImg: 'h-20 w-full object-cover',
  quitar:
    'absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600',
};
