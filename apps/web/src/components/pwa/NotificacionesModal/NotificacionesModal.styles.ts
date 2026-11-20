/** Estilos del centro de notificaciones PWA — burbuja flotante compacta (paridad del Centro de Alertas del escritorio). */
export const notificacionesModalClasses = {
  /* La tarjeta: anclada arriba a la derecha (bajo la campana), mitad del ancho */
  tarjeta:
    'self-start ml-auto mr-2 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5.5rem)] flex flex-col',
  cuerpo: 'px-3 py-2.5 overflow-y-auto scrollbar-none',
  header: 'flex items-start justify-between gap-2 mb-2 sticky top-0 bg-surface z-10',
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
  lista: 'space-y-1',
  item:
    'w-full text-left rounded-xl p-2 hover:bg-ui-50 transition-colors cursor-pointer',
  itemNoLeida: 'bg-primary/5',
  itemNoLeidaMarca: 'inline-block w-1.5 h-1.5 rounded-full bg-primary',
  itemLeidoMarca: 'inline-block w-1.5 h-1.5 rounded-full bg-ui-200',
  itemTitulo: 'text-[13px] font-black text-ui-900 truncate',
  itemFecha: 'text-[9px] font-bold text-ui-400 shrink-0',
  itemMensaje: 'text-[11px] text-ui-600 line-clamp-2 break-words',
};
