/** Estilos del centro de notificaciones PWA — burbuja flotante compacta (paridad del Centro de Alertas del escritorio). */
export const notificacionesModalClasses = {
  /* La tarjeta: anclada SIEMPRE bajo el header del shell (4rem + safe-area),
     contorno redondeado completo con margen a ambos lados, y más grande
     (min-height con su scroll respirando). */
  tarjeta:
    'self-start ml-auto mr-3 mt-[calc(env(safe-area-inset-top)+4rem)] w-80 max-w-[calc(100vw-1.5rem)] h-[min(28rem,60dvh)] flex flex-col rounded-2xl',
  cuerpo: 'px-3 py-2.5 overflow-y-auto scrollbar-none flex-1',
  header: 'flex items-start justify-between gap-2 mb-2 px-3 pt-3 pb-2 sticky top-0 bg-surface z-10 rounded-t-2xl',
  headerTitulo: 'text-xs font-black uppercase tracking-wider text-ui-900',
  headerSub: 'text-[9px] font-bold uppercase tracking-widest text-ui-400 mt-0.5',
  acciones: 'flex gap-0.5 shrink-0',
  accionIcono:
    'h-9 w-9 rounded-lg flex items-center justify-center text-ui-500 hover:bg-ui-100 hover:text-ui-800 transition-colors',
  accionIconoRojo:
    'h-9 w-9 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-300 transition-colors',
  banner: 'bg-ui-50 dark:bg-ui-900/40 border border-ui-200 rounded-xl p-2.5 flex items-center justify-between gap-2 mb-2',
  bannerTitulo: 'text-xs font-black text-ui-900',
  bannerTexto: 'text-[11px] text-ui-600 break-words',
  bannerBoton: 'min-h-[44px] shrink-0',
  vacio: 'py-8 flex flex-col items-center gap-1.5',
  vacioIcono: 'w-10 h-10 text-ui-300',
  vacioTexto: 'text-xs text-ui-400 font-medium',
  lista: 'space-y-1 flex-1 overflow-y-auto scrollbar-none',
  item:
    'w-full text-left rounded-xl p-2 hover:bg-ui-50 transition-colors cursor-pointer',
  itemNoLeida: 'bg-primary/5',
  itemNoLeidaMarca: 'inline-block w-1.5 h-1.5 rounded-full bg-primary',
  itemLeidoMarca: 'inline-block w-1.5 h-1.5 rounded-full bg-ui-200',
  itemTitulo: 'text-[13px] font-black text-ui-900 truncate',
  itemFecha: 'text-[9px] font-bold text-ui-400 shrink-0',
  itemMensaje: 'text-[11px] text-ui-600 line-clamp-2 break-words',
};
