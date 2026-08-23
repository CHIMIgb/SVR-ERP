export const timelineCardClasses = {
  /* ── Wrapper ── */
  wrapper:
    'flex flex-col md:flex-row gap-4 md:gap-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 transition-all hover:border-primary/40 hover:shadow-sm',

  /* ── Sidebar izquierdo (fecha + indicador) ── */
  sidebar:
    'md:w-28 lg:w-32 flex flex-row md:flex-col items-center justify-center md:border-r md:border-slate-100 md:pr-6 gap-2 md:gap-0 shrink-0',

  /* ── Fecha (label) ── */
  dateLabel:
    'text-[10px] font-black text-slate-400 uppercase tracking-widest text-center',

  /* ── Indicador numérico (horas, lectura, etc.) ── */
  indicator:
    'text-xl sm:text-2xl font-black text-primary mt-0 md:mt-1 text-center',

  /* ── Contenido principal ── */
  content: 'flex-1 min-w-0 space-y-3',

  /* ── Título / actividad ── */
  title:
    'font-bold text-slate-900 text-base sm:text-lg leading-tight',

  /* ── Metadatos (máquina, obra, etc.) ── */
  metaRow: 'flex flex-wrap items-center gap-3 sm:gap-4',
  metaItem:
    'flex items-center gap-1.5 text-slate-500 text-xs font-bold',
  metaIcon: 'w-3.5 h-3.5 text-slate-300 shrink-0',
  metaValue: 'text-slate-900',

  /* ── Badges ── */
  badgeRow: 'flex items-center gap-2 flex-wrap',

  /* ── Actions ── */
  actions: 'flex items-center justify-end gap-1 shrink-0',
} as const;
