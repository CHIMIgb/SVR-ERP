/**
 * CATÁLOGO DE ALERTAS — la ÚNICA fuente de las notificaciones que emite el API.
 *
 * Toda emisión usa `construirAlerta(ALERTAS.X, contexto, referenciaId, creadoPor)`
 * y después el helper de audiencia (`emitirATorre`, `emitirARol`, `emitirAUsuario`,
 * `emitirATrabajador`). Los textos ya no se escriben inline en los services.
 *
 * Inventario (clave · disparo · audiencia · tipo):
 * ┌──────────────────────────────────┬──────────────────────────┬───────────────────────────┬────────┐
 * │ REPORTE_NUEVO_TORRE              │ crear reporte            │ torre destino             │ ALERTA │
 * │ REPORTE_ACEPTADO_AUTOR           │ aceptar reporte          │ autor (user)              │ INFO   │
 * │ REPORTE_ASIGNADO_TRABAJADOR      │ asignar responsable      │ trabajador asignado       │ ALERTA │
 * │ REPORTE_REASIGNADO_EX_ANTERIOR   │ reasignar                │ trabajador anterior       │ INFO   │
 * │ REPORTE_REASIGNADO_ACEPTADOR     │ reasignar                │ user que había aceptado   │ INFO   │
 * │ REPORTE_CERRADO_ASIGNADO         │ cerrar reporte           │ trabajador asignado       │ INFO   │
 * │ REPORTE_CERRADO_AUTOR            │ cerrar reporte           │ autor (user)              │ INFO   │
 * │ REPORTE_ACTIVIDAD                │ comentar                 │ asignado + autor (3×)     │ INFO   │
 * │ NOMINA_PAGADA                    │ pagar-todos              │ rol Administrativo        │ INFO   │
 * │ OC_APROBADA                      │ aprobar orden de compra  │ rol Administrativo        │ ALERTA │
 * │ ABONO_ORDEN                      │ abono a orden            │ rol Administrativo        │ INFO   │
 * │ CIERRE_PENDIENTE                 │ registrar cierre de caja │ rol Administrador         │ ALERTA │
 * └──────────────────────────────────┴──────────────────────────┴───────────────────────────┴────────┘
 *
 * Convenciones:
 * - El texto vive AQUÍ (función pura del contexto) — si el texto cambia, cambia
 *   para todas las audiencias que comparten la definición.
 * - Cada definición trunca SU cuerpo (`slice`) donde corresponda; `emitir`
 *   recorta el título a 200.
 * - `TipoNotificacion` se queda con los 3 valores (ALERTA/INFO/CORREO): la
 *   semántica de dominio vive en la `clave`, no en el enum.
 *
 * IMPORTANTE (herramientas): este archivo se edita SOLO con el write/edit tool
 * o con node — Get-Content/Set-Content de PowerShell 5.1 corrompe los acentos
 * (leía UTF-8 como ANSI; incidente del 2026-11-20).
 */
import { TipoNotificacion } from '@prisma/client';
import type { EmitirNotificacionInput } from './notificaciones.service';

export interface DefinicionAlerta<C> {
  clave: string;
  tipo: TipoNotificacion;
  titulo: (c: C) => string;
  cuerpo: (c: C) => string;
  referenciaTipo: string;
}

/** Lo que consumen los helpers de audiencia (emitirA*). */
export type EntradaAlerta = Omit<
  EmitirNotificacionInput,
  'audienciaRolId' | 'audienciaTorre' | 'destinatarioUserId'
>;

/** Construye la entrada a partir de la definición del catálogo + contexto. */
export function construirAlerta<C>(
  def: DefinicionAlerta<C>,
  ctx: C,
  referenciaId: string,
  creadoPor: string,
): EntradaAlerta {
  return {
    tipo: def.tipo,
    titulo: def.titulo(ctx),
    cuerpo: def.cuerpo(ctx),
    referenciaTipo: def.referenciaTipo,
    referenciaId,
    creadoPor,
  };
}

/* ── Contextos (los campos que necesita cada texto) ─────────────────────── */

interface CtxCodigoDescripcion {
  codigo: string | null;
  descripcion: string | null;
}
interface CtxAceptado {
  nombreAceptor: string;
  codigo: string | null;
  descripcion: string | null;
}
interface CtxNuevoTorre {
  codigo: string | null;
  prioridadLabel: string;
  descripcion: string;
}
interface CtxAsignado extends CtxNuevoTorre {}
interface CtxActividad {
  codigo: string | null;
  nombreAutor: string;
  texto: string;
}
interface CtxNomina {
  periodo: string | null;
  periodoId: string;
  count: number;
}
interface CtxOrden {
  folio: string | null;
  proveedor: string | null;
  monto: number;
}
interface CtxAbono {
  folio: string | null;
  proveedor: string;
  monto: number;
  codigoPago: string;
}
interface CtxCierre {
  cajero: string;
  fecha: string;
  totalVentas: number;
  diferencia: number;
}

const moneda = (n: number): string =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

/* ── El catálogo ────────────────────────────────────────────────────────── */

export const ALERTAS = {
  /** B5.10: aviso a TODA el área del reporte. */
  REPORTE_NUEVO_TORRE: {
    clave: 'REPORTE_NUEVO_TORRE',
    tipo: TipoNotificacion.ALERTA,
    titulo: (c: CtxNuevoTorre) => `Nuevo reporte ${c.codigo ?? ''}`,
    cuerpo: (c: CtxNuevoTorre) => `${c.prioridadLabel} — ${c.descripcion.slice(0, 140)}`,
    referenciaTipo: 'reportes_campo',
  },
  REPORTE_ACEPTADO_AUTOR: {
    clave: 'REPORTE_ACEPTADO_AUTOR',
    tipo: TipoNotificacion.INFO,
    titulo: (c: CtxAceptado) => `${c.nombreAceptor} aceptó tu reporte ${c.codigo ?? ''}`,
    cuerpo: (c: CtxCodigoDescripcion) => c.descripcion?.slice(0, 140) ?? '',
    referenciaTipo: 'reportes_campo',
  },
  REPORTE_ASIGNADO_TRABAJADOR: {
    clave: 'REPORTE_ASIGNADO_TRABAJADOR',
    tipo: TipoNotificacion.ALERTA,
    titulo: (c: CtxNuevoTorre) => `Te asignaron el reporte ${c.codigo ?? ''}`,
    cuerpo: (c: CtxAsignado) => `${c.prioridadLabel} — ${c.descripcion.slice(0, 140)}`,
    referenciaTipo: 'reportes_campo',
  },
  REPORTE_REASIGNADO_EX_ANTERIOR: {
    clave: 'REPORTE_REASIGNADO_EX_ANTERIOR',
    tipo: TipoNotificacion.INFO,
    titulo: (c: CtxCodigoDescripcion) => `El reporte ${c.codigo ?? ''} fue reasignado a otra persona`,
    cuerpo: (c: CtxCodigoDescripcion) => c.descripcion?.slice(0, 140) ?? '',
    referenciaTipo: 'reportes_campo',
  },
  REPORTE_REASIGNADO_ACEPTADOR: {
    clave: 'REPORTE_REASIGNADO_ACEPTADOR',
    tipo: TipoNotificacion.INFO,
    titulo: (c: CtxCodigoDescripcion) =>
      `El reporte ${c.codigo ?? ''} que aceptaste fue reasignado a otra persona`,
    cuerpo: (c: CtxCodigoDescripcion) => c.descripcion?.slice(0, 140) ?? '',
    referenciaTipo: 'reportes_campo',
  },
  REPORTE_CERRADO_ASIGNADO: {
    clave: 'REPORTE_CERRADO_ASIGNADO',
    tipo: TipoNotificacion.INFO,
    titulo: (c: CtxCodigoDescripcion) => `Cerraron el reporte ${c.codigo ?? ''} que tenías asignado`,
    cuerpo: (c: CtxCodigoDescripcion) => c.descripcion?.slice(0, 140) ?? '',
    referenciaTipo: 'reportes_campo',
  },
  REPORTE_CERRADO_AUTOR: {
    clave: 'REPORTE_CERRADO_AUTOR',
    tipo: TipoNotificacion.INFO,
    titulo: (c: CtxCodigoDescripcion) => `Cerraron tu reporte ${c.codigo ?? ''}`,
    cuerpo: (c: CtxCodigoDescripcion) => c.descripcion?.slice(0, 140) ?? '',
    referenciaTipo: 'reportes_campo',
  },
  REPORTE_ACTIVIDAD: {
    clave: 'REPORTE_ACTIVIDAD',
    tipo: TipoNotificacion.INFO,
    titulo: (c: CtxActividad) => `Nueva actividad en el reporte ${c.codigo ?? ''}`,
    cuerpo: (c: CtxActividad) => `${c.nombreAutor}: "${c.texto.trim().slice(0, 120)}"`,
    referenciaTipo: 'reportes_campo',
  },
  NOMINA_PAGADA: {
    clave: 'NOMINA_PAGADA',
    tipo: TipoNotificacion.INFO,
    titulo: () => 'Nómina pagada',
    cuerpo: (c: CtxNomina) => `El periodo ${c.periodo ?? c.periodoId} quedó PAGADO (${c.count} nómina(s)).`,
    referenciaTipo: 'periodos_nomina',
  },
  OC_APROBADA: {
    clave: 'OC_APROBADA',
    tipo: TipoNotificacion.ALERTA,
    titulo: (c: CtxOrden) => `Orden ${c.folio} aprobada`,
    cuerpo: (c: CtxOrden) =>
      `${c.proveedor ?? 'Proveedor'} — ${moneda(c.monto)} comprometidos en la orden de compra.`,
    referenciaTipo: 'ordenes_compra',
  },
  ABONO_ORDEN: {
    clave: 'ABONO_ORDEN',
    tipo: TipoNotificacion.INFO,
    titulo: (c: CtxAbono) => `Abono a orden ${c.folio}`,
    cuerpo: (c: CtxAbono) => `${c.proveedor} — ${moneda(c.monto)} abonados (pago ${c.codigoPago}).`,
    referenciaTipo: 'pagos_proveedor',
  },
  CIERRE_PENDIENTE: {
    clave: 'CIERRE_PENDIENTE',
    tipo: TipoNotificacion.ALERTA,
    titulo: () => 'Cierre de caja pendiente de aprobación',
    cuerpo: (c: CtxCierre) =>
      `${c.cajero} registró el cierre de ${c.fecha} — total ${moneda(c.totalVentas)} (diferencia ${moneda(c.diferencia)}).`,
    referenciaTipo: 'cierres_caja',
  },
};
