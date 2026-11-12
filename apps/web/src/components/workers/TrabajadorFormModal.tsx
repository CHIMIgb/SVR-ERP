"use client";

import React, { useRef, useState } from 'react';
import {
  trabajadoresApi,
  type CatalogosTrabajadoresDTO,
  type IdentidadAltaDTO,
  type TrabajadorAccesoInput,
  type TrabajadorCreateInput,
  type TrabajadorDTO,
} from '@/lib/api';
import { APP_TIMEZONE } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/layout/Toast';
import { Button } from '@/components/ui/Button';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';

// Modelo de 5 roles (decisión SVR): los PUESTOS van aquí — cada uno con su
// torre y su rol en la BD (categorias_puesto alimenta users.torre y el acceso
// del alta). "Otro" = perfil laboral SIN acceso a la app.
export const CATEGORIAS_PUESTO = [
  { value: 'Operador', label: 'Operador de maquinaria' },
  { value: 'Chofer', label: 'Chofer' },
  { value: 'Mecanico', label: 'Mecánico' },
  { value: 'Tecnico Diesel', label: 'Técnico Diésel' },
  { value: 'Soldador', label: 'Soldador' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Ingeniero', label: 'Ingeniero o encargado' },
  { value: 'RRHH', label: 'RRHH' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Otro', label: 'Otro (sin acceso a la app)' },
] as const;

const METODOS_PAGO: { value: TrabajadorCreateInput['metodoPago']; label: string }[] = [
  { value: 'Mixto', label: 'Mixto (transferencia y efectivo)' },
  { value: 'Tarjeta', label: 'Solo transferencia' },
  { value: 'Efectivo', label: 'Solo efectivo' },
];

/** Operadores y choferes son los únicos que llevan máquina asignada. */
export function llevaMaquina(categoria: string): boolean {
  return categoria === 'Operador' || categoria === 'Chofer';
}

// Mismas reglas que CreateTrabajadorDto / UpdateTrabajadorDto de la API.
const NOMBRE_MIN = 3;
const NOMBRE_MAX = 120;
const PUESTO_MIN = 2;
const PUESTO_MAX = 120;
const TELEFONO_MIN = 7;
const TELEFONO_MAX = 20;
const HORA_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
// Mismo patrón que TELEFONO_VALIDO de la API: al menos 7 dígitos.
const TELEFONO_VALIDO = /^(?=(?:\D*\d){7})[0-9+()\s-]+$/;
/** Monto con hasta 2 decimales (redondear en silencio cambiaría lo que el usuario escribió). */
const MONTO_VALIDO = /^\d+(\.\d{1,2})?$/;

interface FormState {
  nombre: string;
  categoriaPuesto: string;
  puesto: string;
  telefono: string;
  entrada: string;
  fechaContratacion: string;
  proyecto: string;
  maquinaId: string;
  metodoPago: TrabajadorCreateInput['metodoPago'];
  sueldoFiscal: string;
  sueldoEfectivo: string;
  /** P14: identidad de acceso a la app — solo en el alta. */
  rolId: string;
  encargadoId: string;
  /** PR #18 #8: dar acceso a la app a un trabajador sin cuenta (solo edición). */
  darAcceso: boolean;
}

type Errores = Partial<Record<keyof FormState, string>>;

function hoyLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function estadoInicial(t: TrabajadorDTO | null): FormState {
  if (!t) {
    return {
      nombre: '',
      categoriaPuesto: 'Operador',
      puesto: '',
      telefono: '',
      entrada: '07:00',
      fechaContratacion: hoyLocal(),
      proyecto: '',
      maquinaId: '',
      metodoPago: 'Mixto',
      sueldoFiscal: '',
      sueldoEfectivo: '',
      rolId: '',
      encargadoId: '',
      darAcceso: false,
    };
  }
  return {
    nombre: t.nombre,
    categoriaPuesto: t.categoriaPuesto,
    puesto: t.puesto,
    telefono: t.telefono,
    entrada: t.entrada,
    fechaContratacion: t.fechaContratacion ?? '',
    proyecto: t.proyectos[0] ?? '',
    maquinaId: t.maquinaAsignadaId ?? '',
    metodoPago: t.metodoPago,
    sueldoFiscal: String(t.sueldoFiscal),
    sueldoEfectivo: String(t.sueldoEfectivo),
    // PR #18 #8: acceso a la app precargado de la cuenta existente
    rolId: t.rolAccesoId ?? '',
    encargadoId: t.encargadoUserId ?? '',
    darAcceso: false,
  };
}

/** Monto en centavos exactos, o null si no es un número válido mayor o igual a cero. */
function leerMonto(valor: string): number | null {
  const limpio = valor.trim();
  if (!MONTO_VALIDO.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

function validar(f: FormState, editando: boolean, pideAcceso: boolean): Errores {
  const e: Errores = {};
  const nombre = f.nombre.trim();
  if (nombre.length < NOMBRE_MIN || nombre.length > NOMBRE_MAX) {
    e.nombre = `Escribe el nombre completo (${NOMBRE_MIN} a ${NOMBRE_MAX} caracteres).`;
  }
  const puesto = f.puesto.trim();
  if (puesto.length < PUESTO_MIN || puesto.length > PUESTO_MAX) {
    e.puesto = `Indica el puesto (${PUESTO_MIN} a ${PUESTO_MAX} caracteres).`;
  }
  const telefono = f.telefono.trim();
  if (telefono.length < TELEFONO_MIN || telefono.length > TELEFONO_MAX) {
    e.telefono = `El teléfono lleva de ${TELEFONO_MIN} a ${TELEFONO_MAX} caracteres.`;
  } else if (!TELEFONO_VALIDO.test(telefono)) {
    e.telefono = 'Lleva al menos 7 dígitos; usa solo números, espacios, guiones, paréntesis o +.';
  }
  if (!HORA_HHMM.test(f.entrada)) e.entrada = 'Indica la hora de entrada.';
  if (!f.fechaContratacion) {
    e.fechaContratacion = 'Indica la fecha de ingreso: de ella sale la antigüedad del finiquito.';
  } else if (f.fechaContratacion > hoyLocal()) {
    e.fechaContratacion = 'La fecha de ingreso no puede ser futura.';
  }
  const fiscal = leerMonto(f.sueldoFiscal);
  const efectivo = leerMonto(f.sueldoEfectivo);
  if (fiscal === null) e.sueldoFiscal = 'Escribe un monto con hasta 2 decimales (0 si no aplica).';
  if (efectivo === null) e.sueldoEfectivo = 'Escribe un monto con hasta 2 decimales (0 si no aplica).';
  if (fiscal !== null && efectivo !== null && fiscal + efectivo <= 0) {
    e.sueldoEfectivo = 'El sueldo semanal total debe ser mayor a cero.';
  }
  // Misma regla que la API (METODO_PAGO_INCOHERENTE).
  if (f.metodoPago === 'Efectivo' && fiscal !== null && fiscal > 0) {
    e.sueldoFiscal = 'Con pago solo en efectivo debe ser 0 (o cambia el esquema a Mixto).';
  }
  if (f.metodoPago === 'Tarjeta' && efectivo !== null && efectivo > 0) {
    e.sueldoEfectivo = 'Con pago solo por transferencia debe ser 0 (o cambia el esquema a Mixto).';
  }
  // P14: el alta siempre crea la identidad (numero_empleado + PIN temporal) con el rol elegido.
  // PR #18 #8: en edición también es requerido si hay cuenta o se pide dar acceso.
  if (pideAcceso && !f.rolId) {
    e.rolId = 'Elige el rol de acceso a la app del trabajador.';
  }
  return e;
}

interface TrabajadorFormModalProps {
  /** null = alta nueva. */
  trabajador: TrabajadorDTO | null;
  catalogos: CatalogosTrabajadoresDTO | null;
  catalogosCargando: boolean;
  errorCatalogos: string | null;
  onReintentarCatalogos: () => void;
  onClose: () => void;
  onGuardado: (t: TrabajadorDTO, identidad?: IdentidadAltaDTO) => void;
}

export default function TrabajadorFormModal({
  trabajador,
  catalogos,
  catalogosCargando,
  errorCatalogos,
  onReintentarCatalogos,
  onClose,
  onGuardado,
}: TrabajadorFormModalProps) {
  const { showToast } = useToast();
  const original = estadoInicial(trabajador);
  const [form, setForm] = useState<FormState>(original);
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const enviandoRef = useRef(false);

  const editando = trabajador !== null;
  const conMaquina = llevaMaquina(form.categoriaPuesto);
  // Con error de recarga, el catálogo que quedó puede estar viejo: no se usa para asignar.
  const catalogoListo = catalogos !== null && !errorCatalogos;
  const dadoDeBaja = trabajador?.estado === 'Inactivo';

  const cambiar = <K extends keyof FormState>(campo: K, valor: FormState[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  };

  // Regla del cliente (igual que la API): "Solo efectivo" no lleva transferencia y "Solo transferencia" no lleva
  // efectivo. Al elegir el esquema, el sueldo que no aplica queda en 0 y no se puede editar.
  const cambiarMetodoPago = (metodo: TrabajadorCreateInput['metodoPago']) => {
    setForm((f) => ({
      ...f,
      metodoPago: metodo,
      ...(metodo === 'Efectivo' ? { sueldoFiscal: '0' } : {}),
      ...(metodo === 'Tarjeta' ? { sueldoEfectivo: '0' } : {}),
    }));
    setErrores((e) => ({ ...e, sueldoFiscal: undefined, sueldoEfectivo: undefined }));
  };
  // Se bloquea solo si ya está en 0: un trabajador guardado antes con otra combinación debe poder corregirse aquí.
  const sinTransferencia = form.metodoPago === 'Efectivo' && leerMonto(form.sueldoFiscal) === 0;
  const sinEfectivo = form.metodoPago === 'Tarjeta' && leerMonto(form.sueldoEfectivo) === 0;

  // Opciones de máquina: se marca la que ya tiene otro operador, porque al guardar pasa a este trabajador.
  const maquinas = catalogos?.maquinas ?? [];
  const maquinaElegida = maquinas.find((m) => m.codigo === form.maquinaId);
  const maquinaDeOtro =
    maquinaElegida && maquinaElegida.operadorId && maquinaElegida.operadorId !== trabajador?.id ? maquinaElegida : null;
  const maquinaFueraDeCatalogo =
    form.maquinaId && catalogoListo && !maquinaElegida && trabajador?.maquinaAsignadaId === form.maquinaId;

  const proyectos = catalogos?.proyectos ?? [];
  const proyectoFueraDeCatalogo =
    form.proyecto && catalogoListo && !proyectos.some((p) => p.nombre === form.proyecto);
  const otrosProyectos = trabajador ? trabajador.proyectos.length - 1 : 0;

  // Acceso a la app (PR #18 #8 + decisión del SVR): en el ALTA el rol sale del
  // puesto (sin select); en la EDICIÓN se exige rol solo si hay cuenta o se
  // marca "dar acceso".
  const teniaAcceso = !!trabajador?.usuarioId;
  const pideAcceso = editando && (teniaAcceso || form.darAcceso);
  const puestoElegido = catalogos?.puestos?.find((p) => p.nombre === form.categoriaPuesto);

  const guardar = async () => {
    if (enviandoRef.current) return;
    const encontrados = validar(form, editando, pideAcceso);
    if (Object.values(encontrados).some(Boolean)) {
      setErrores(encontrados);
      showToast('Revisa los campos marcados.', 'error');
      return;
    }

    const base = {
      nombre: form.nombre.trim(),
      puesto: form.puesto.trim(),
      categoriaPuesto: form.categoriaPuesto,
      telefono: form.telefono.trim(),
      entrada: form.entrada,
      sueldoFiscal: leerMonto(form.sueldoFiscal) ?? 0,
      sueldoEfectivo: leerMonto(form.sueldoEfectivo) ?? 0,
      metodoPago: form.metodoPago,
    };

    let payload: Partial<TrabajadorCreateInput> & { acceso?: TrabajadorAccesoInput };
    if (!editando) {
      // El ROL sale del PUESTO (decisión del SVR): el server lo resuelve de
      // categorias_puesto.rol_id — "Otro" no lleva cuenta.
      payload = {
        ...base,
        ...(form.encargadoId && { encargadoId: form.encargadoId }),
        fechaContratacion: form.fechaContratacion,
        ...(form.proyecto && { proyecto: form.proyecto }),
        ...(conMaquina && form.maquinaId && { maquinaId: form.maquinaId }),
      };
    } else {
      payload = { ...base };
      if (form.fechaContratacion !== original.fechaContratacion) payload.fechaContratacion = form.fechaContratacion;
      // Proyecto y máquina solo se mandan si cambiaron: '' le dice a la API que quite la asignación.
      // A un dado de baja no se le asigna nada (la API lo rechaza).
      if (catalogoListo && !dadoDeBaja && form.proyecto !== original.proyecto) payload.proyecto = form.proyecto;
      if (!conMaquina) {
        // Dejó de ser operador o chofer: la máquina se libera aunque el catálogo no haya cargado.
        if (original.maquinaId) payload.maquinaId = '';
      } else if (catalogoListo && !dadoDeBaja && form.maquinaId !== original.maquinaId) {
        payload.maquinaId = form.maquinaId;
      }
      // Acceso a la app (PR #18 #8): solo si cambió algo respecto al original.
      const rolCambio = teniaAcceso && form.rolId !== original.rolId;
      const jefeCambio = form.encargadoId !== original.encargadoId;
      if (form.darAcceso && !teniaAcceso) {
        // sin cuenta: crea la identidad completa (temporal de 24 h)
        payload.acceso = { rolId: form.rolId, ...(form.encargadoId && { encargadoId: form.encargadoId }) };
      } else if (teniaAcceso && (rolCambio || jefeCambio) && form.rolId) {
        payload.acceso = { rolId: form.rolId, ...(jefeCambio && { encargadoId: form.encargadoId }) };
      }
    }

    enviandoRef.current = true;
    setGuardando(true);
    try {
      if (trabajador) {
        const res = await trabajadoresApi.actualizar(trabajador.id, payload);
        if (!res.success) {
          showToast(res.error.message, 'error');
          return;
        }
        showToast(`${res.data.nombre} actualizado.`, 'success');
        // PR #18 #8: si se otorgó acceso nuevo, el temporal viaja en la respuesta
        onGuardado(res.data, res.data.identidad);
      } else {
        const res = await trabajadoresApi.crear(payload as TrabajadorCreateInput);
        if (!res.success) {
          showToast(res.error.message, 'error');
          return;
        }
        showToast(`${res.data.nombre} dado de alta.`, 'success');
        onGuardado(res.data, res.data.identidad);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar el trabajador.', 'error');
    } finally {
      enviandoRef.current = false;
      setGuardando(false);
    }
  };

  const cerrar = () => {
    if (!guardando) onClose();
  };

  return (
    <FormModal
      open
      onClose={cerrar}
      onSubmit={guardar}
      title={editando ? 'Editar trabajador' : 'Alta de trabajador'}
      subtitle={editando ? trabajador.nombre : undefined}
      submitLabel={guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Dar de alta'}
      isSubmitting={guardando}
    >
      <div className="space-y-4">
        {errorCatalogos && (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10"
          >
            <p className="text-xs text-amber-800 dark:text-amber-300">
              No se pudieron cargar las máquinas y los proyectos ({errorCatalogos}). Puedes guardar lo demás; la asignación
              no se modifica.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onReintentarCatalogos} disabled={catalogosCargando} className="shrink-0">
              {catalogosCargando ? 'Cargando…' : 'Reintentar'}
            </Button>
          </div>
        )}

        <ModalField label="Nombre completo" required error={errores.nombre}>
          <input
            aria-label="Nombre completo"
            className={modalInputClass}
            placeholder="Juan Pérez García"
            maxLength={NOMBRE_MAX}
            value={form.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        </ModalField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Categoría" required>
            <select
              aria-label="Categoría"
              className={modalSelectClass}
              value={form.categoriaPuesto}
              onChange={(e) => cambiar('categoriaPuesto', e.target.value)}
            >
              {CATEGORIAS_PUESTO.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Puesto" required error={errores.puesto}>
            <input
              aria-label="Puesto"
              className={modalInputClass}
              placeholder="Ej: Operador de excavadora"
              maxLength={PUESTO_MAX}
              value={form.puesto}
              onChange={(e) => cambiar('puesto', e.target.value)}
            />
          </ModalField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editando && !teniaAcceso && (
              <label className="sm:col-span-2 flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-ui-300 text-primary focus:ring-primary/40"
                  checked={form.darAcceso}
                  onChange={(e) => cambiar('darAcceso', e.target.checked)}
                />
                <span className="text-sm text-ui-800">
                  Dar acceso a la app móvil <span className="text-xs text-ui-500">(crea su número de empleado y PIN temporal)</span>
                </span>
              </label>
            )}
            {editando && teniaAcceso && (
              <p className="sm:col-span-2 text-xs text-ui-500">
                Cuenta de acceso: <strong>{trabajador!.numeroEmpleado}</strong>
                {trabajador!.rolAccesoNombre ? ` · rol actual: ${trabajador!.rolAccesoNombre}` : ''}. Los
                cambios de rol o encargado se aplican al guardar.
              </p>
            )}
            {pideAcceso && (
              <ModalField label="Rol de acceso a la app" required={pideAcceso} error={errores.rolId}>
                  <select
                    aria-label="Rol de acceso a la app"
                    className={modalSelectClass}
                    value={form.rolId}
                    disabled={!catalogoListo}
                    onChange={(e) => cambiar('rolId', e.target.value)}
                  >
                    {!catalogoListo ? (
                      <option value="">{catalogosCargando ? 'Cargando roles…' : 'No disponible'}</option>
                    ) : (
                      <>
                        <option value="">Elige el rol…</option>
                        {(catalogos?.roles ?? []).map((r) => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </>
                    )}
                  </select>
              </ModalField>
            )}
            <ModalField label="Encargado (Residente)" hint="Opcional: quién lleva su control en obra.">
                  <select
                    aria-label="Encargado Residente"
                    className={modalSelectClass}
                    value={form.encargadoId}
                    disabled={!catalogoListo}
                    onChange={(e) => cambiar('encargadoId', e.target.value)}
                  >
                    {!catalogoListo ? (
                      <option value="">{catalogosCargando ? 'Cargando residentes…' : 'No disponible'}</option>
                    ) : (
                      <>
                        <option value="">Sin encargado</option>
                        {(catalogos?.residentes ?? []).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombre}{r.numeroEmpleado ? ` (${r.numeroEmpleado})` : ''}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
            </ModalField>
            {/* Alta: el ROL sale del PUESTO (decisión del SVR) — nota derivada del catálogo */}
            {!editando && puestoElegido && (
              puestoElegido.rolNombre ? (
                <p className="sm:col-span-2 text-xs text-ui-500">
                  Tendrá acceso a la app móvil como <strong>{puestoElegido.rolNombre}</strong>: al guardar se genera
                  su <strong>número de empleado</strong> y un <strong>PIN temporal de 24 h</strong>; ahí mismo puedes
                  enviarlos por WhatsApp.
                </p>
              ) : (
                <p className="sm:col-span-2 text-xs text-ui-500">
                  Este puesto <strong>no incluye acceso a la app móvil</strong> (sin usuario ni PIN). Se lo puedes
                  dar después desde su ficha.
                </p>
              )
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ModalField label="Teléfono" required error={errores.telefono}>
            <input
              aria-label="Teléfono"
              type="tel"
              inputMode="tel"
              className={modalInputClass}
              placeholder="55 1234 5678"
              maxLength={TELEFONO_MAX}
              value={form.telefono}
              onChange={(e) => cambiar('telefono', e.target.value)}
            />
          </ModalField>
          <ModalField label="Hora de entrada" required error={errores.entrada}>
            <input
              aria-label="Hora de entrada"
              type="time"
              className={modalInputClass}
              value={form.entrada}
              onChange={(e) => cambiar('entrada', e.target.value)}
            />
          </ModalField>
          <ModalField label="Fecha de ingreso" required error={errores.fechaContratacion}>
            <input
              aria-label="Fecha de ingreso"
              type="date"
              className={modalInputClass}
              max={hoyLocal()}
              value={form.fechaContratacion}
              onChange={(e) => cambiar('fechaContratacion', e.target.value)}
            />
          </ModalField>
        </div>

        {dadoDeBaja ? (
          <p className="text-xs text-ui-500">
            Dado de baja: no se le asigna proyecto ni máquina. Puedes corregir sus demás datos.
          </p>
        ) : (
          <>
            <ModalField
              label="Proyecto asignado"
              hint={otrosProyectos > 0
                ? `Tiene ${trabajador?.proyectos.length} proyectos asignados. Si eliges otro, quedará solo en ese.`
                : undefined}
            >
              <select
                aria-label="Proyecto asignado"
                className={modalSelectClass}
                value={form.proyecto}
                disabled={!catalogoListo}
                onChange={(e) => cambiar('proyecto', e.target.value)}
              >
                {!catalogoListo ? (
                  <option value={form.proyecto}>{catalogosCargando ? 'Cargando proyectos…' : form.proyecto || 'No disponible'}</option>
                ) : (
                  <>
                    <option value="">Sin proyecto</option>
                    {proyectoFueraDeCatalogo && <option value={form.proyecto}>{form.proyecto} (inactivo)</option>}
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </>
                )}
              </select>
            </ModalField>

            {conMaquina && (
              <ModalField
                label="Máquina asignada"
                hint={maquinaDeOtro
                  ? `Hoy la tiene ${maquinaDeOtro.operadorNombre ?? 'otro operador'}: al guardar pasa a este trabajador.`
                  : undefined}
              >
                <select
                  aria-label="Máquina asignada"
                  className={modalSelectClass}
                  value={form.maquinaId}
                  disabled={!catalogoListo}
                  onChange={(e) => cambiar('maquinaId', e.target.value)}
                >
                  {!catalogoListo ? (
                    <option value={form.maquinaId}>
                      {catalogosCargando ? 'Cargando máquinas…' : form.maquinaId || 'No disponible'}
                    </option>
                  ) : (
                    <>
                      <option value="">Sin máquina</option>
                      {maquinaFueraDeCatalogo && (
                        <option value={form.maquinaId}>{form.maquinaId} · {trabajador?.maquinaAsignadaNombre}</option>
                      )}
                      {maquinas.map((m) => (
                        <option key={m.codigo} value={m.codigo}>
                          {m.codigo} · {m.nombre}
                          {m.operadorId && m.operadorId !== trabajador?.id ? ` (la tiene ${m.operadorNombre ?? 'otro operador'})` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </ModalField>
            )}
          </>
        )}
        {editando && !conMaquina && original.maquinaId && (
          <p className="text-xs text-ui-500">
            Al guardar se libera la máquina {original.maquinaId}: solo operadores y choferes llevan máquina.
          </p>
        )}

        <div className="pt-4 border-t border-ui-100 space-y-4">
          <ModalField label="Esquema de pago" required>
            <select
              aria-label="Esquema de pago"
              className={modalSelectClass}
              value={form.metodoPago}
              onChange={(e) => cambiarMetodoPago(e.target.value as TrabajadorCreateInput['metodoPago'])}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </ModalField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalField
              label="Sueldo semanal por transferencia"
              required={!sinTransferencia}
              error={errores.sueldoFiscal}
              hint={sinTransferencia ? 'No aplica: cobra solo en efectivo.' : undefined}
            >
              <input
                aria-label="Sueldo semanal por transferencia"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className={cn(modalInputClass, sinTransferencia && 'opacity-60 cursor-not-allowed')}
                placeholder="0.00"
                value={form.sueldoFiscal}
                disabled={sinTransferencia}
                onChange={(e) => cambiar('sueldoFiscal', e.target.value)}
              />
            </ModalField>
            <ModalField
              label="Sueldo semanal en efectivo"
              required={!sinEfectivo}
              error={errores.sueldoEfectivo}
              hint={sinEfectivo ? 'No aplica: cobra solo por transferencia.' : undefined}
            >
              <input
                aria-label="Sueldo semanal en efectivo"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className={cn(modalInputClass, sinEfectivo && 'opacity-60 cursor-not-allowed')}
                placeholder="0.00"
                value={form.sueldoEfectivo}
                disabled={sinEfectivo}
                onChange={(e) => cambiar('sueldoEfectivo', e.target.value)}
              />
            </ModalField>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
