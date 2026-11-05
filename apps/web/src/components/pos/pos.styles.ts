// Clases Tailwind compartidas del Punto de Venta (componentes/pos/*)
// Regla de migración (globals.css): bg-white → bg-surface, slate-N → ui-N.
// EXCEPCIÓN INTENCIONAL: ticketPaper/ticket* permanecen en blanco porque el
// ticket térmico 58mm que se imprime SIEMPRE es papel claro (regla del plan).
export const posClasses = {
  // Tarjetas / contenedores
  card: 'bg-surface rounded-xl border border-ui-200 shadow-sm p-4 sm:p-5',
  sectionTitle: 'text-sm font-bold text-ui-800',
  muted: 'text-xs text-ui-500',

  // Scanner
  hint: 'text-[11px] text-ui-400 mt-2',

  // Fila del carrito
  cartRow: 'flex items-center gap-2 sm:gap-3 py-2.5 border-b border-ui-50 last:border-0',
  stepBtn:
    'w-7 h-7 rounded-lg border border-ui-200 text-ui-600 font-bold flex items-center justify-center hover:bg-ui-100 active:bg-ui-200 transition-colors disabled:opacity-40',
  qtyText: 'w-7 text-center font-black text-sm text-ui-800',

  // Total del carrito
  cartTotalLabel: 'text-sm font-bold text-ui-700',
  cartTotalValue: 'text-xl sm:text-2xl font-black text-primary',

  // Panel de pago
  fieldLabel: 'text-xs font-bold text-ui-500 uppercase tracking-wide mb-1.5 block',
  chipBase:
    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
  chipActive: 'bg-primary text-white border-primary shadow-sm',
  chipInactive: 'bg-surface text-ui-600 border-ui-200 hover:bg-ui-50',

  // Billetes / monedas
  billBtn:
    'px-3 py-2 rounded-lg border border-ui-200 bg-ui-50 text-ui-700 text-xs font-black hover:bg-ui-100 active:bg-ui-200 transition-colors',
  billGroupLabel: 'text-[10px] font-bold text-ui-400 uppercase tracking-wide mb-1.5',

  // Transferencia / tarjeta placeholder
  terminalBox: 'bg-ui-50 border border-ui-200 rounded-xl p-4 text-center',
  terminalTitle: 'font-bold text-ui-800 text-sm mt-2',
  terminalText: 'text-xs text-ui-500 mt-1 leading-relaxed',
  terminalAmount: 'font-black text-primary',

  // Descuento / autorización
  approvalBox: 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-start gap-2',
  approvalText: 'text-xs text-amber-700 dark:text-amber-300 font-medium',

  // Total a pagar
  totalRow: 'flex items-baseline justify-between border-t border-ui-200 pt-3 mt-3',
  totalLabel: 'text-sm font-bold text-ui-600',
  totalValue: 'text-primary font-black text-2xl sm:text-3xl',

  // Ticket (papel térmico — SIEMPRE claro, se imprime)
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
  historyRow: 'flex items-center justify-between gap-3 py-2.5 border-b border-ui-50 last:border-0',
  historyTicket: 'text-xs font-black text-primary',
  historyMeta: 'text-[11px] text-ui-400',
  historyTotal: 'font-black text-ui-900 text-sm whitespace-nowrap',

  // Cierre de caja / arqueo
  denomEntry: 'bg-ui-50 border border-ui-200 rounded-lg p-2',
  denomLabel: 'text-xs font-black text-ui-700 text-center mb-1',
  denomInput:
    'w-full text-center text-sm font-bold rounded-md border border-ui-200 bg-surface px-2 py-1.5 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10',
  resultRow: 'flex items-center justify-between py-1.5',
  resultLabel: 'text-sm font-medium text-ui-500',
  resultValue: 'font-black text-ui-900',
  alertBox: 'flex items-start gap-2 rounded-xl border p-3',
  summaryCard:
    'bg-surface rounded-xl border border-ui-200 shadow-sm p-4 flex flex-col items-start gap-1',
  summaryValue: 'font-black text-xl sm:text-2xl text-ui-900',
  summaryLabel: 'text-[11px] font-bold text-ui-400 uppercase tracking-wide',
};
