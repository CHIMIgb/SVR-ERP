// Clases Tailwind compartidas del Punto de Venta (componentes/pos/*)
export const posClasses = {
  // Tarjetas / contenedores
  card: 'bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5',
  sectionTitle: 'text-sm font-bold text-slate-800',
  muted: 'text-xs text-slate-500',

  // Scanner
  hint: 'text-[11px] text-slate-400 mt-2',

  // Fila del carrito
  cartRow: 'flex items-center gap-2 sm:gap-3 py-2.5 border-b border-slate-50 last:border-0',
  stepBtn:
    'w-7 h-7 rounded-lg border border-slate-200 text-slate-600 font-bold flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40',
  qtyText: 'w-7 text-center font-black text-sm text-slate-800',

  // Total del carrito
  cartTotalLabel: 'text-sm font-bold text-slate-700',
  cartTotalValue: 'text-xl sm:text-2xl font-black text-primary',

  // Panel de pago
  fieldLabel: 'text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block',
  chipBase:
    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
  chipActive: 'bg-primary text-white border-primary shadow-sm',
  chipInactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',

  // Billetes / monedas
  billBtn:
    'px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-black hover:bg-slate-100 active:bg-slate-200 transition-colors',
  billGroupLabel: 'text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5',

  // Terminal / QR placeholder
  terminalBox: 'bg-slate-50 border border-slate-200 rounded-xl p-4 text-center',
  terminalTitle: 'font-bold text-slate-800 text-sm mt-2',
  terminalText: 'text-xs text-slate-500 mt-1 leading-relaxed',
  terminalAmount: 'font-black text-primary',

  // Descuento / autorización
  approvalBox: 'bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2',
  approvalText: 'text-xs text-amber-700 font-medium',

  // Total a pagar
  totalRow: 'flex items-baseline justify-between border-t border-slate-200 pt-3 mt-3',
  totalLabel: 'text-sm font-bold text-slate-600',
  totalValue: 'text-primary font-black text-2xl sm:text-3xl',

  // Ticket (papel térmico)
  ticketPaper: 'bg-white border border-slate-200 rounded-xl p-4 max-w-[320px] mx-auto font-mono text-[12px] text-slate-900',
  ticketCenter: 'text-center',
  ticketLogo:
    'w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm mx-auto mb-2',
  ticketDivider: 'border-t border-dashed border-slate-300 my-3',
  ticketRow: 'flex justify-between py-0.5',
  ticketSection: 'font-bold text-center my-1',
  ticketBarcodeBox: 'text-center my-2',
  ticketBarcodeNum: 'font-mono text-[12px] tracking-[2px] mt-1',
  ticketFooter: 'text-[9px] text-slate-500 text-center mt-2',
  ticketLegal: 'text-[8px] text-slate-400 text-center mt-1 leading-snug',

  // Historial de ventas
  historyRow: 'flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0',
  historyTicket: 'text-xs font-black text-primary',
  historyMeta: 'text-[11px] text-slate-400',
  historyTotal: 'font-black text-slate-900 text-sm whitespace-nowrap',

  // Cierre de caja / arqueo
  denomEntry: 'bg-slate-50 border border-slate-200 rounded-lg p-2',
  denomLabel: 'text-xs font-black text-slate-700 text-center mb-1',
  denomInput:
    'w-full text-center text-sm font-bold rounded-md border border-slate-200 bg-white px-2 py-1.5 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10',
  resultRow: 'flex items-center justify-between py-1.5',
  resultLabel: 'text-sm font-medium text-slate-500',
  resultValue: 'font-black text-slate-900',
  alertBox: 'flex items-start gap-2 rounded-xl border p-3',
  retirementRow: 'flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0',
  summaryCard:
    'bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col items-start gap-1',
  summaryValue: 'font-black text-xl sm:text-2xl text-slate-900',
  summaryLabel: 'text-[11px] font-bold text-slate-400 uppercase tracking-wide',
};