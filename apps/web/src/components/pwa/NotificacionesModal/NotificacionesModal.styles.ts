/** Estilos del centro de notificaciones PWA — aplicados con cn(). */
export const notificacionesModalClasses = {
  acciones: 'flex gap-2 mb-3',
  boton: 'min-h-[44px] flex-1',
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
