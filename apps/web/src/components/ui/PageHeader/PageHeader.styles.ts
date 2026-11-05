/* Responsivo: el bloque de acciones baja de linea cuando no cabe junto al titulo
   (antes se aplastaba el titulo y se cortaban los botones). Titulo y subtitulo
   hacen salto de linea en vez de truncarse. */
export const pageHeaderClasses = {
  wrapper: 'flex flex-wrap items-center justify-between gap-x-6 gap-y-3',
  heading: 'grow basis-72 min-w-0',
  title: 'text-2xl sm:text-3xl font-black tracking-tight text-ui-900 break-words',
  subtitle: 'text-xs sm:text-sm text-ui-500 mt-1',
  actions: 'max-w-full',
};
