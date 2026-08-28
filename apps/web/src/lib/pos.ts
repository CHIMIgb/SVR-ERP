// ─────────────────────────────────────────────────────────────────────────────
// lib/pos.ts — Lógica del Punto de Venta (SVR-ERP)
//
// Adaptado del prototipo mobile (PROTOTIPO/apps/mobile/src/lib/pos.ts) al
// contexto SVR: materiales de construcción, moneda MXN únicamente, sin
// dependencias externas (código de barras y QR simulados determinísticos).
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';
export type CardType = 'debito' | 'credito';

export interface Payment {
  method: PaymentMethod;
  amount: number;
}

export interface TaxBreakdown {
  subtotal: number;
  iva: number;
  ieps: number;
  totalTax: number;
}

export interface PaymentDetails {
  cardType?: CardType;
  lastFour?: string;
  authCode?: string;
  affiliation?: string;
  reference?: string;
  speiAccount?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category?: string;
  condition: string;
  stock: number;
  /** Unidad de venta por defecto del material (m³, pieza, bulto, etc.). */
  unit: string;
  /** Medidas en las que se puede vender el material (default = primera). */
  units?: string[];
  priceMxn: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** Unidad de medida elegida por el cajero (default = product.unit). */
  unit?: string;
  /** Descuento porcentual por producto (0-100) — reservado para overrides futuros. */
  discountPct?: number;
  /** Precio manual sobreescrito por el cajero (autorizado). */
  priceOverride?: number;
}

/** Identificador único de la línea de carrito (producto + medida elegida). */
export function cartLineKey(item: CartItem): string {
  return `${item.product.id}:${item.unit ?? item.product.unit}`;
}

/** Unidad de medida efectiva de una línea (la elegida o la del producto). */
export function itemUnitName(item: CartItem): string {
  return item.unit ?? item.product.unit;
}

export interface POSSale {
  id: string;
  ticketNumber: string;
  folio: string;
  terminal: string;
  registerNumber: string;
  customer: string;
  cashier: string;
  items: CartItem[];
  total: number;
  method: PaymentMethod;
  cashReceived?: number;
  change?: number;
  payments?: Payment[];
  taxBreakdown: TaxBreakdown;
  paymentDetails: PaymentDetails;
  discountPct?: number;
  discountTotal?: number;
  authorizedBy?: string;
  itemsSold: number;
  createdAt: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  branch: string;
  branchCode: string;
  rfc: string;
  phone: string;
}

export const BUSINESS_INFO: BusinessInfo = {
  name: 'SVR Constructora',
  address: 'Av. del Mar 123, Col. Centro, Compostela, Nay.',
  branch: 'Compostela, Nay.',
  branchCode: 'SUC-CMP-001',
  rfc: 'SVR220101XXX',
  phone: '(327) 123-4567',
};

export const SPEI_ACCOUNT = '0123 4567 8910 1122';

/** Terminal y caja por defecto del punto de venta web. */
export const POS_TERMINAL = 'TER-01';
export const POS_REGISTER = 'CAJA-PV';

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de productos (mock, fase 1 frontend)
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  { id: 'p1', sku: 'MAT-001', barcode: '750000000101', name: 'Arena de río', category: 'Áridos', condition: 'Nuevo', stock: 120, unit: 'm³', units: ['m³', 'tonelada', 'viaje'], priceMxn: 350 },
  { id: 'p2', sku: 'MAT-002', barcode: '750000000102', name: 'Grava 3/4"', category: 'Áridos', condition: 'Nuevo', stock: 80, unit: 'm³', units: ['m³', 'tonelada', 'viaje'], priceMxn: 420 },
  { id: 'p3', sku: 'MAT-003', barcode: '750000000103', name: 'Grava 1/2"', category: 'Áridos', condition: 'Nuevo', stock: 65, unit: 'm³', units: ['m³', 'tonelada', 'viaje'], priceMxn: 430 },
  { id: 'p4', sku: 'MAT-004', barcode: '750000000104', name: 'Criba fina', category: 'Áridos', condition: 'Nuevo', stock: 40, unit: 'm³', units: ['m³', 'tonelada', 'viaje'], priceMxn: 280 },
  { id: 'p5', sku: 'MAT-005', barcode: '750000000105', name: 'Criba gruesa', category: 'Áridos', condition: 'Nuevo', stock: 35, unit: 'm³', units: ['m³', 'tonelada', 'viaje'], priceMxn: 290 },
  { id: 'p6', sku: 'MAT-006', barcode: '750000000106', name: 'Tezontle', category: 'Áridos', condition: 'Nuevo', stock: 50, unit: 'm³', units: ['m³', 'tonelada', 'viaje'], priceMxn: 500 },
  { id: 'p7', sku: 'MAT-007', barcode: '750000000107', name: 'Tepetate', category: 'Áridos', condition: 'Nuevo', stock: 90, unit: 'm³', units: ['m³', 'tonelada', 'viaje'], priceMxn: 180 },
  { id: 'p8', sku: 'MAT-008', barcode: '750000000108', name: 'Block 15x20x40', category: 'Materiales', condition: 'Nuevo', stock: 800, unit: 'pieza', units: ['pieza', 'm²'], priceMxn: 12 },
  { id: 'p9', sku: 'MAT-009', barcode: '750000000109', name: 'Cemento CPC 40 (50 kg)', category: 'Materiales', condition: 'Nuevo', stock: 150, unit: 'bulto', units: ['bulto'], priceMxn: 185 },
  { id: 'p10', sku: 'MAT-010', barcode: '750000000110', name: 'Varilla 3/8" (12 m)', category: 'Acero', condition: 'Nuevo', stock: 200, unit: 'pieza', units: ['pieza', 'tonelada'], priceMxn: 95 },
  { id: 'p11', sku: 'MAT-011', barcode: '750000000111', name: 'Malla electrosoldada 6x6', category: 'Acero', condition: 'Nuevo', stock: 45, unit: 'pieza', units: ['pieza', 'm²'], priceMxn: 650 },
  { id: 'p12', sku: 'MAT-012', barcode: '750000000112', name: 'Cal hidratada (bolsa)', category: 'Materiales', condition: 'Nuevo', stock: 60, unit: 'bolsa', units: ['bolsa'], priceMxn: 55 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo del carrito
// ─────────────────────────────────────────────────────────────────────────────

export function itemUnitPrice(item: CartItem): number {
  return item.priceOverride ?? item.product.priceMxn;
}

export function itemSubtotal(item: CartItem): number {
  const discountFactor = 1 - (item.discountPct ?? 0) / 100;
  return itemUnitPrice(item) * item.quantity * discountFactor;
}

export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + itemSubtotal(item), 0);
}

export function discountAmount(total: number, pct: number): number {
  return (total * pct) / 100;
}

export function applyDiscount(total: number, pct: number): number {
  return Math.max(0, total - discountAmount(total, pct));
}

export function getChange(received: number, total: number): number {
  return Math.max(0, received - total);
}

/** Desglose de impuestos fijo al 16% IVA (subtotal = total / 1.16). */
export function calculateTaxBreakdown(total: number): TaxBreakdown {
  const subtotal = total / 1.16;
  const iva = total - subtotal;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    ieps: 0,
    totalTax: Math.round(iva * 100) / 100,
  };
}

/** Detalles de pago simulados para el ticket. */
export function buildPaymentDetails(method: PaymentMethod): PaymentDetails {
  if (method === 'tarjeta') {
    return {
      cardType: 'debito',
      lastFour: '2845',
      authCode: String(Math.floor(100000 + Math.random() * 900000)),
      affiliation: '4091403',
    };
  }
  if (method === 'transferencia') {
    return {
      reference: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      speiAccount: SPEI_ACCOUNT,
    };
  }
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Folios y fechas
// ─────────────────────────────────────────────────────────────────────────────

/** Folio único escaneable de 16 caracteres alfanuméricos. */
export function generateSaleFolio(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let folio = '';
  let seed = Date.now() + Math.floor(Math.random() * 1000);
  for (let i = 0; i < 16; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    folio += chars[Math.floor((seed / 233280) * chars.length)];
  }
  return folio;
}

export function generateTicketNumber(salesCount: number): string {
  return `T-${String(salesCount + 1).padStart(5, '0')}`;
}

export function formatTicketDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function isToday(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Código de barras del ticket (Code 39)
// ─────────────────────────────────────────────────────────────────────────────

const CODE39_PATTERNS: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', '*': '010010100',
};

export interface BarcodeBar {
  x: number;
  width: number;
}

/** Barras Code 39 de un código (para renderizar el código de barras del ticket). */
export function barcodeBars(code: string): BarcodeBar[] {
  const NARROW = 2;
  const WIDE = 4;
  const QUIET = 10;

  const bars: BarcodeBar[] = [];
  let x = QUIET;
  for (const ch of `*${code}*`) {
    const pattern = CODE39_PATTERNS[ch];
    if (!pattern) continue;
    for (let i = 0; i < pattern.length; i++) {
      const width = pattern[i] === '1' ? WIDE : NARROW;
      if (i % 2 === 0) bars.push({ x, width });
      x += width;
    }
    x += NARROW;
  }
  return bars;
}

// ─────────────────────────────────────────────────────────────────────────────
// QR simulado (determinista: patrón pseudoaleatorio + finder patterns)
// ─────────────────────────────────────────────────────────────────────────────

export const QR_SIZE = 21;

export function buildQrMatrix(seed: string): boolean[][] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rand = () => {
    hash = (hash * 1103515245 + 12345) >>> 0;
    return hash / 4294967296;
  };

  const grid: boolean[][] = [];
  for (let y = 0; y < QR_SIZE; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < QR_SIZE; x++) row.push(rand() > 0.5);
    grid.push(row);
  }

  const finder: [number, number][] = [
    [0, 0],
    [QR_SIZE - 7, 0],
    [0, QR_SIZE - 7],
  ];
  for (const [fx, fy] of finder) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const inRing = x === 0 || y === 0 || x === 6 || y === 6;
        const inCore = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[fy + y][fx + x] = inRing || inCore;
      }
    }
  }
  return grid;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monto en letras (formato ticket mexicano)
// ─────────────────────────────────────────────────────────────────────────────

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIEZ_A_VEINTE = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function enteroALetras(n: number): string {
  if (n === 0) return 'cero';
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIEZ_A_VEINTE[n - 10];
  if (n < 30) return n === 20 ? 'veinte' : `veinti${UNIDADES[n - 20]}`;
  if (n < 100) {
    const decena = Math.floor(n / 10);
    const unidad = n % 10;
    return unidad === 0 ? DECENAS[decena] : `${DECENAS[decena]} y ${UNIDADES[unidad]}`;
  }
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    if (n === 100) return 'cien';
    return resto === 0 ? CENTENAS[centena] : `${CENTENAS[centena]} ${enteroALetras(resto)}`;
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const milesTexto = miles === 1 ? 'mil' : `${enteroALetras(miles)} mil`;
    return resto === 0 ? milesTexto : `${milesTexto} ${enteroALetras(resto)}`;
  }
  if (n < 10000000) {
    const millones = Math.floor(n / 1000000);
    const resto = n % 1000000;
    const millonesTexto = millones === 1 ? 'un millón' : `${enteroALetras(millones)} millones`;
    return resto === 0 ? millonesTexto : `${millonesTexto} ${enteroALetras(resto)}`;
  }
  return String(n);
}

export function numberToWords(amount: number): string {
  const entero = Math.floor(amount);
  const centavos = Math.round((amount - entero) * 100);
  return `${enteroALetras(entero)} pesos ${String(centavos).padStart(2, '0')}/100 M.N.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Impresión del ticket (web: abre ventana de impresión con HTML)
// ─────────────────────────────────────────────────────────────────────────────

function methodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'efectivo':
      return 'Efectivo';
    case 'tarjeta':
      return 'Tarjeta';
    case 'transferencia':
      return 'Transferencia';
  }
}

export function printTicket(sale: POSSale, businessInfo: BusinessInfo): void {
  const { date, time } = formatTicketDate(sale.createdAt);
  const initials =
    businessInfo.name
      .split(' ')
      .filter((w) => w.length > 2 && w[0] !== '[')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SVR';

  const itemsHtml = sale.items
    .map((item) => {
      const unit = itemUnitPrice(item);
      const lineTotal = itemSubtotal(item);
      const hasOverride = (item.priceOverride ?? item.product.priceMxn) !== item.product.priceMxn;
      const name = item.product.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      return `
        <tr>
          <td style="vertical-align:top; padding:3px 0;">
            <div style="font-weight:bold;">${name}${hasOverride ? ' (PM)' : ''}${item.discountPct ? ` -${item.discountPct}%` : ''}</div>
            <div style="font-size:10px; color:#6b7280;">SKU: ${item.product.sku} · ${itemUnitName(item)}</div>
          </td>
          <td style="text-align:center; vertical-align:top; padding:3px 0; width:36px;">x${item.quantity}</td>
          <td style="text-align:right; vertical-align:top; padding:3px 0; width:56px;">$${unit.toFixed(2)}</td>
          <td style="text-align:right; vertical-align:top; padding:3px 0; width:56px; font-weight:bold;">$${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  const payments = sale.payments?.length ? sale.payments : [{ method: sale.method, amount: sale.total }];
  const tax = sale.taxBreakdown;
  const pieces = sale.items.reduce((sum, i) => sum + i.quantity, 0);

  const paymentDetailsHtml = (() => {
    const d = sale.paymentDetails;
    if (sale.method === 'tarjeta' || (payments.length > 1 && payments.some((p) => p.method === 'tarjeta'))) {
      return `
        <div class="row"><span>Tipo</span><span>${d.cardType === 'credito' ? 'Crédito' : 'Débito'}</span></div>
        <div class="row"><span>Tarjeta</span><span>**** ${d.lastFour ?? '****'}</span></div>
        <div class="row"><span>Aut#</span><span>${d.authCode ?? ''}</span></div>
        <div class="row"><span>Afiliación</span><span>${d.affiliation ?? ''}</span></div>
      `;
    }
    if (sale.method === 'transferencia') {
      return `
        <div class="row"><span>Cuenta SPEI</span><span>${d.speiAccount ?? ''}</span></div>
        <div class="row"><span>Referencia</span><span>${d.reference ?? ''}</span></div>
      `;
    }
    return '';
  })();

  const cashHtml =
    sale.method === 'efectivo' && sale.cashReceived != null
      ? `
        <div class="row"><span>Recibido</span><span>$${sale.cashReceived.toFixed(2)}</span></div>
        <div class="row"><span>Cambio</span><span>$${(sale.change ?? 0).toFixed(2)}</span></div>
      `
      : '';

  const discountHtml = sale.discountPct
    ? `<div class="row"><span>Descuento (${sale.discountPct}%)</span><span>−$${(sale.discountTotal ?? 0).toFixed(2)}</span></div>`
    : '';

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page { margin: 0; }
          body { font-family: 'Courier New', Courier, monospace; padding: 8px; color: #111827; background: #fff; margin: 0 auto; max-width: 302px; font-size: 12px; line-height: 1.3; }
          .center { text-align: center; }
          .logo { width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background: #111827; color: #fff; font-weight: bold; font-size: 16px; margin: 0 auto 8px; text-align: center; }
          .business-name { font-size: 14px; font-weight: bold; }
          .business-line { font-size: 10px; color: #374151; }
          .divider { border-top: 1px dashed #9ca3af; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; padding: 1px 0; }
          .section-title { font-weight: bold; margin-top: 6px; margin-bottom: 2px; text-align: center; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { text-align: left; border-bottom: 1px dashed #9ca3af; padding: 3px 0; font-size: 10px; }
          .total { font-weight: bold; font-size: 14px; border-top: 1px dashed #9ca3af; padding-top: 4px; margin-top: 4px; }
          .letters { font-size: 10px; text-align: center; margin: 6px 0; font-style: italic; }
          .footer { font-size: 9px; color: #4b5563; text-align: center; margin-top: 8px; }
          .legal { font-size: 8px; color: #6b7280; text-align: center; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="logo">${initials}</div>
          <div class="business-name">${businessInfo.name}</div>
          <div class="business-line">R.F.C. ${businessInfo.rfc}</div>
          <div class="business-line">${businessInfo.address}</div>
          <div class="business-line">${businessInfo.branch} · ${businessInfo.branchCode}</div>
          <div class="business-line">Tel. ${businessInfo.phone}</div>
        </div>
        <div class="divider"></div>
        <div class="section-title">TICKET DE VENTA</div>
        <div class="row"><span>Folio</span><span>${sale.folio}</span></div>
        <div class="row"><span>Ticket</span><span>${sale.ticketNumber}</span></div>
        <div class="row"><span>Fecha</span><span>${date}</span></div>
        <div class="row"><span>Hora</span><span>${time}</span></div>
        <div class="row"><span>Terminal</span><span>${sale.terminal}</span></div>
        <div class="row"><span>Caja</span><span>${sale.registerNumber}</span></div>
        <div class="row"><span>Cajero</span><span>${sale.cashier}</span></div>
        <div class="row"><span>Cliente</span><span>${sale.customer || 'Público en general'}</span></div>
        <div class="divider"></div>
        <table>
          <thead><tr><th>ARTÍCULO</th><th style="text-align:center">CANT</th><th style="text-align:right">P.UNIT</th><th style="text-align:right">TOTAL</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="divider"></div>
        <div class="row"><span>Subtotal</span><span>$${tax.subtotal.toFixed(2)}</span></div>
        <div class="row"><span>IVA 16%</span><span>$${tax.iva.toFixed(2)}</span></div>
        <div class="row"><span>IEPS</span><span>$${tax.ieps.toFixed(2)}</span></div>
        ${discountHtml}
        ${payments.map((p) => `<div class="row"><span>${methodLabel(p.method)}</span><span>$${p.amount.toFixed(2)}</span></div>`).join('')}
        ${paymentDetailsHtml}
        ${cashHtml}
        <div class="row total"><span>TOTAL</span><span>$${sale.total.toFixed(2)}</span></div>
        ${sale.authorizedBy ? `<div style="font-size:10px; color:#6b7280; margin-top:4px; text-align:center;">Autorizado por: ${sale.authorizedBy}</div>` : ''}
        <div class="letters">${numberToWords(sale.total)}</div>
        <div class="center" style="font-size:10px;">
          ${sale.itemsSold} artículo${sale.itemsSold !== 1 ? 's' : ''} vendido${sale.itemsSold !== 1 ? 's' : ''} · ${pieces} piezas
        </div>
        <div class="divider"></div>
        <div class="footer">Gracias por su compra</div>
        <div class="legal">Política de devoluciones: presente este ticket. Devoluciones dentro de los 30 días naturales en el mismo punto de venta.</div>
        <div class="legal">Régimen General de Personas Morales. Este comprobante no es un comprobante fiscal digital.</div>
      </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=400,height=1000,resizable=yes,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}