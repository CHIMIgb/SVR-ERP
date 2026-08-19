export const dataTableClasses = {
  container: 'w-full overflow-hidden rounded-xl border border-slate-200 bg-white',
  table: 'w-full text-sm',

  /* ── Headers ── */
  headerCell: 'px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap',
  headerCellRight: 'px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest whitespace-nowrap',
  headerCellCenter: 'px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest whitespace-nowrap',

  /* ── Header Colors ── */
  headerDefault: 'bg-slate-50 text-slate-500 border-b border-slate-100',
  headerBlue: 'bg-blue-50 text-blue-600 border-b border-blue-100',
  headerGreen: 'bg-green-50 text-green-600 border-b border-green-100',
  headerAmber: 'bg-amber-50 text-amber-600 border-b border-amber-100',
  headerRed: 'bg-red-50 text-red-600 border-b border-red-100',
  headerPurple: 'bg-purple-50 text-purple-600 border-b border-purple-100',
  headerSlate: 'bg-slate-100 text-slate-600 border-b border-slate-200',
  headerPrimary: 'bg-primary/5 text-primary border-b border-primary/10',

  /* ── Body ── */
  row: 'border-b border-slate-100 last:border-0 transition-colors',
  rowInteractive: 'hover:bg-slate-50/80 cursor-pointer',
  rowEven: 'bg-white',
  rowOdd: 'bg-slate-50/30',
  cell: 'px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap',
  cellRight: 'px-4 py-3.5 text-sm text-slate-700 text-right whitespace-nowrap',
  cellCenter: 'px-4 py-3.5 text-sm text-slate-700 text-center whitespace-nowrap',

  /* ── Loading ── */
  skeleton: 'animate-pulse bg-slate-200 rounded',
};
