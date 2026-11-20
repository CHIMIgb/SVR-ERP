/** Estilos del centro de notificaciones PWA — aplicados con cn(). Paridad con el Centro de Alertas del escritorio. */
export const notificacionesModalClasses = {
  header: 'flex items-start justify-between gap-2 mb-3',
  headerTitulo: 'text-sm font-black uppercase tracking-wider text-ui-900',
  headerSub: 'text-[9px] font-bold uppercase tracking-widest text-ui-400 mt-0.5',
  acciones: 'flex gap-1 shrink-0',
  accionIcono:
    'h-11 w-11 rounded-xl flex items-center justify-center text-ui-500 hover:bg-ui-100 hover:text-ui-800 transition-colors',
  accionIconoRojo:
    'h-11 w-11 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-300 transition-colors',
  vacio: 'py-10 flex flex-col items-center gap-2',
  vacioIcono: 'w-12 h-12 text-ui-300',
  vacioTexto: 'text-sm text-ui-400 font-medium',
  item:
    'w-full text-left rounded-xl border border-ui-200 p-3 hover:bg-ui-50 transition-colors cursor-pointer',
  itemNoLeida: 'bg-primary/5 border-primary/30',
  itemNoLeidaMarca: 'inline-block w-2 h-2 rounded-full bg-primary',
  itemLeidoMarca: 'inline-block w-2 h-2 rounded-full bg-ui-200',
  itemTitulo: 'text-sm font-black text-ui-900 break-words mt-1',
  itemMensaje: 'text-[13px] text-ui-600 break-words',
  itemFecha: 'text-[10px] font-bold text-ui-400 mt-1',
  pie: 'flex gap-2 w-full',
  botonPie: 'min-h-[44px] w-full',
};
