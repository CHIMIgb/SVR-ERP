export const tabsClasses = {
  // max-w-full recorta el ancho usado al del padre: el piso de min-content de w-fit (con triggers
  // shrink-0 la lista mide la suma completa de pestañas) desbordaba al documento en móvil y el
  // overflow-x-auto dejaba de scrollear. Si Tabs vive algún día dentro de un flex row, ahí sí haría
  // falta min-w-0 en el ancestro flex.
  list: 'flex w-fit max-w-full overflow-x-auto gap-1 p-1 bg-ui-100 rounded-xl scrollbar-none',
  trigger:
    'shrink-0 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer select-none data-[active=true]:bg-surface data-[active=true]:text-ui-900 dark:data-[active=true]:bg-ui-200 data-[active=true]:shadow-sm data-[active=true]:font-semibold text-ui-500 hover:text-ui-700',
};
