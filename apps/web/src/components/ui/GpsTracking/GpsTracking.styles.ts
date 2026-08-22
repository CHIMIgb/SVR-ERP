export const gpsClasses = {
  /* ── Map Container ── */
  mapContainer:
    'relative w-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden',
  mapGrid:
    'absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px]',
  mapOverlay:
    'absolute inset-0 bg-gradient-to-b from-slate-100/50 via-transparent to-slate-100/80',

  /* ── Machine Marker ── */
  marker:
    'absolute flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110',
  markerIcon:
    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-white',
  markerPulse:
    'absolute -inset-2 rounded-xl animate-ping opacity-30',
  markerLabel:
    'mt-1 px-2 py-0.5 rounded-md bg-white/90 shadow-sm text-[10px] font-bold text-slate-700 whitespace-nowrap backdrop-blur-sm',

  /* ── Live Indicator ── */
  liveDot:
    'relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200',
  livePulse:
    'w-2 h-2 rounded-full bg-green-500 animate-pulse',
  liveText:
    'text-xs font-semibold text-green-700',

  /* ── Tracking Panel ── */
  panel:
    'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
  panelHeader:
    'px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 min-w-0',
  panelBody:
    'p-4 space-y-3 overflow-hidden',
  panelRow:
    'flex items-center justify-between py-2 border-b border-slate-50 last:border-0 gap-2 min-w-0',
  panelLabel:
    'text-xs text-slate-500 shrink-0',
  panelValue:
    'text-sm font-semibold text-slate-800 truncate min-w-0',

  /* ── Status Badges ── */
  statusMoving:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shrink-0',
  statusIdle:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold shrink-0',
  statusOffline:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold shrink-0',
  statusAlert:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold shrink-0',

  /* ── Speed Gauge ── */
  gauge:
    'relative w-16 h-16 sm:w-20 sm:h-20',
  gaugeBg:
    'absolute inset-0 rounded-full border-4 border-slate-100',
  gaugeFill:
    'absolute inset-0 rounded-full border-4 border-primary border-t-transparent border-r-transparent',
  gaugeText:
    'absolute inset-0 flex flex-col items-center justify-center',
  gaugeValue:
    'text-lg sm:text-xl font-black text-slate-900 leading-none',
  gaugeUnit:
    'text-[10px] font-semibold text-slate-500 uppercase',

  /* ── Timeline ── */
  timeline:
    'space-y-0',
  timelineItem:
    'relative flex gap-3 pb-4 last:pb-0',
  timelineDot:
    'relative z-10 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm mt-1',
  timelineLine:
    'absolute left-[5px] top-4 w-0.5 h-full bg-slate-200',
  timelineContent:
    'flex-1 min-w-0',
  timelineTime:
    'text-[10px] font-semibold text-slate-400 uppercase',
  timelineText:
    'text-sm text-slate-700 mt-0.5 break-words',
};
