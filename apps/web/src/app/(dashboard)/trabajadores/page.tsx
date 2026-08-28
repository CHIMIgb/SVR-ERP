"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, UserCheck, UserMinus, Truck, Compass, Wrench, Building2, FileText,
  ClipboardList, CheckCircle2, AlertCircle, Calendar,
} from 'lucide-react';
import type { Maquina } from '@svr-erp/shared';
import {
  trabajadoresApi, bitacorasRentaApi, catalogosApi,
  type TrabajadorDTO, type TrabajadorCreateInput, type BitacoraRentaDTO, type ProyectoCatalogoDTO,
} from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import WorkerCard from '@/components/workers/WorkerCard';
import BitacorasRentaModal from '@/components/workers/BitacorasRentaModal';
import LiquidacionModal from '@/components/workers/LiquidacionModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency } from '@/lib/formatters';

const PAGE_SIZE = 12;

const CATEGORIAS = [
  { id: 'Todos', label: 'Todos los Puestos', icon: UserCheck },
  { id: 'Operador', label: 'Operadores de Maquinaria', icon: Truck },
  { id: 'Chofer', label: 'Choferes de Transporte', icon: Compass },
  { id: 'Mecanico', label: 'Mecánicos de Taller', icon: Wrench },
  { id: 'Ingeniero', label: 'Ingenieros y Encargados', icon: Building2 },
  { id: 'Administrativo', label: 'Administración', icon: FileText },
] as const;

const emptyForm = {
  nombre: '',
  puesto: '',
  categoriaPuesto: 'Operador' as TrabajadorCreateInput['categoriaPuesto'],
  telefono: '',
  entrada: '07:00',
  proyecto: '',
  sueldoFiscal: '2500',
  sueldoEfectivo: '3500',
  metodoPago: 'Mixto' as TrabajadorCreateInput['metodoPago'],
  maquinaId: '',
};

export default function TrabajadoresPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const vista = user?.vistas?.find((v) => v.ruta === '/trabajadores');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [maquinaria, setMaquinaria] = useState<Maquina[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoCatalogoDTO[]>([]);
  const [bitacorasCountPorTrabajador, setBitacorasCountPorTrabajador] = useState<Record<string, number>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const [activeMainTab, setActiveMainTab] = useState<'plantilla' | 'bitacoras_renta'>('plantilla');
  const [selectedRole, setSelectedRole] = useState<(typeof CATEGORIAS)[number]['id']>('Todos');
  const [search, setSearch] = useState('');

  const [bitacorasConcentrado, setBitacorasConcentrado] = useState<BitacoraRentaDTO[]>([]);
  const [bitacorasLoading, setBitacorasLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bitacorasModalOpen, setBitacorasModalOpen] = useState(false);
  const [selectedWorkerForBitacora, setSelectedWorkerForBitacora] = useState<TrabajadorDTO | null>(null);
  const [liquidacionModalOpen, setLiquidacionModalOpen] = useState(false);
  const [selectedWorkerForLiquidacion, setSelectedWorkerForLiquidacion] = useState<TrabajadorDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const fetchTrabajadores = useCallback(async (page = 1, searchVal = search, role = selectedRole) => {
    const res = await trabajadoresApi.listar({
      search: searchVal || undefined,
      categoriaPuesto: role !== 'Todos' ? role : undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (res.success) {
      setTrabajadores(res.data.items);
      setPagination(res.data.pagination);
      setErrorCarga(null);

      // Conteo de bitácoras por operador — para el badge del botón en cada card.
      const operadores = res.data.items.filter((t) => t.categoriaPuesto === 'Operador' || t.categoriaPuesto === 'Chofer');
      const conteos = await Promise.all(
        operadores.map((t) => bitacorasRentaApi.listar({ trabajadorId: t.id, limit: 1 })),
      );
      const mapa: Record<string, number> = {};
      operadores.forEach((t, i) => {
        const res2 = conteos[i];
        mapa[t.id] = res2.success ? res2.data.pagination.total : 0;
      });
      setBitacorasCountPorTrabajador(mapa);
    } else {
      setErrorCarga(res.error.message);
    }
    hasLoaded.current = true;
    setInitialLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBitacorasConcentrado = useCallback(async (searchVal = search) => {
    setBitacorasLoading(true);
    const res = await bitacorasRentaApi.listar({ search: searchVal || undefined, limit: 100 });
    if (res.success) setBitacorasConcentrado(res.data.items);
    setBitacorasLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    catalogosApi.maquinas().then((res) => {
      if (res.success) setMaquinaria(res.data as unknown as Maquina[]);
    });
    catalogosApi.proyectos().then((res) => {
      if (res.success) setProyectos(res.data);
    });
    fetchTrabajadores(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeMainTab === 'bitacoras_renta') fetchBitacorasConcentrado(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab]);

  useEffect(() => {
    if (maquinaria.length > 0 && !form.maquinaId) {
      setForm((f) => ({ ...f, maquinaId: maquinaria[0].id }));
    }
  }, [maquinaria, form.maquinaId]);

  const handleSearchChange = (value: string) => setSearch(value);

  const handleSearch = () => {
    if (activeMainTab === 'plantilla') fetchTrabajadores(1, search, selectedRole);
    else fetchBitacorasConcentrado(search);
  };

  const handleRoleChange = (role: (typeof CATEGORIAS)[number]['id']) => {
    setSelectedRole(role);
    fetchTrabajadores(1, search, role);
  };

  const handlePageChange = (page: number) => fetchTrabajadores(page, search, selectedRole);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, maquinaId: maquinaria[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (t: TrabajadorDTO) => {
    setEditingId(t.id);
    setForm({
      nombre: t.nombre,
      puesto: t.puesto,
      categoriaPuesto: t.categoriaPuesto as TrabajadorCreateInput['categoriaPuesto'],
      telefono: t.telefono,
      entrada: t.entrada,
      proyecto: t.proyectos[0] ?? '',
      sueldoFiscal: String(t.sueldoFiscal),
      sueldoEfectivo: String(t.sueldoEfectivo),
      metodoPago: t.metodoPago,
      maquinaId: maquinaria.find((m) => m.id === t.maquinaAsignadaId)?.id ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.puesto.trim()) {
      showToast('Por favor completa nombre y puesto.', 'error');
      return;
    }

    const payload: TrabajadorCreateInput = {
      nombre: form.nombre.trim(),
      puesto: form.puesto.trim(),
      categoriaPuesto: form.categoriaPuesto,
      telefono: form.telefono || '55 0000 0000',
      entrada: form.entrada,
      sueldoFiscal: parseFloat(form.sueldoFiscal) || 2000,
      sueldoEfectivo: parseFloat(form.sueldoEfectivo) || 3000,
      metodoPago: form.metodoPago,
      proyecto: form.proyecto || undefined,
      maquinaId: form.categoriaPuesto === 'Operador' || form.categoriaPuesto === 'Chofer' ? form.maquinaId || undefined : undefined,
    };

    setSubmitting(true);
    const res = editingId ? await trabajadoresApi.actualizar(editingId, payload) : await trabajadoresApi.crear(payload);
    setSubmitting(false);

    if (res.success) {
      showToast(`${res.data.nombre} ${editingId ? 'actualizado' : 'dado de alta'} correctamente.`, 'success');
      setModalOpen(false);
      fetchTrabajadores(pagination.page, search, selectedRole);
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleOpenBitacorasModal = (worker: TrabajadorDTO) => {
    setSelectedWorkerForBitacora(worker);
    setBitacorasModalOpen(true);
  };

  const handleOpenLiquidacion = (worker: TrabajadorDTO) => {
    setSelectedWorkerForLiquidacion(worker);
    setLiquidacionModalOpen(true);
  };

  const bitacorasColumns: Column<BitacoraRentaDTO>[] = [
    {
      key: 'folio',
      header: 'Folio & Fecha',
      render: (b) => (
        <div>
          <span className="font-black text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">{b.folio}</span>
          <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{b.fecha}</p>
        </div>
      ),
    },
    {
      key: 'operador',
      header: 'Operador & Máquina',
      render: (b) => (
        <div>
          <div className="font-bold text-slate-900 text-sm">{b.trabajadorNombre}</div>
          <p className="text-[10px] text-primary font-bold">{b.maquinaId} — {b.maquinaNombre}</p>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente & Frente de Obra',
      render: (b) => (
        <div>
          <div className="font-black text-slate-800 text-xs">{b.cliente}</div>
          <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{b.obraUbicacion}</p>
        </div>
      ),
    },
    {
      key: 'horas',
      header: 'Horas & Horómetro',
      align: 'center',
      render: (b) => (
        <div>
          <div className="text-xs font-black text-slate-900">{b.horasEfectivas + b.horasExtras} hrs</div>
          <p className="text-[9px] text-slate-400 font-mono">{b.horometroInicial} a {b.horometroFinal}</p>
        </div>
      ),
    },
    {
      key: 'firma',
      header: 'Vo.Bo. Residente Cliente',
      render: (b) => (
        b.firmaCliente.firmado ? (
          <div className="text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{b.firmaCliente.nombreResidente}</span>
          </div>
        ) : (
          <div className="text-amber-700 text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><span>Pendiente de Firma</span>
          </div>
        )
      ),
    },
    {
      key: 'importe',
      header: 'Importe Cobro',
      align: 'right',
      render: (b) => <span className="font-black text-slate-900 text-sm">{formatCurrency(b.importeTotalRenta)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (b) => (
        <Badge variant={b.estadoCobro === 'Facturado' ? 'info' : b.estadoCobro === 'Listo para Facturar' ? 'success' : 'warning'} size="sm">
          {b.estadoCobro}
        </Badge>
      ),
    },
  ];

  if (errorCarga && !hasLoaded.current) {
    return (
      <div className="card p-8 text-center space-y-3 border border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-red-700">{errorCarga}</p>
        <Button onClick={() => fetchTrabajadores(1)}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Personal & Operadores"
        subtitle="Control de plantilla por categorías, asignación de maquinaria y bitácoras de renta diaria."
        action={
          puedeCrear ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                icon={<UserMinus size={16} />}
                onClick={() => { setSelectedWorkerForLiquidacion(null); setLiquidacionModalOpen(true); }}
              >
                Liquidar / Finiquito
              </Button>
              <Button icon={<Plus size={16} />} onClick={openCreate}>Alta de Empleado</Button>
            </div>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          { key: 'plantilla', label: 'Plantilla de Personal', icon: <UserCheck size={16} />, count: pagination.total },
          { key: 'bitacoras_renta', label: 'Bitácoras de Renta Diaria', icon: <ClipboardList size={16} /> },
        ]}
        value={activeMainTab}
        onChange={(key) => setActiveMainTab(key as 'plantilla' | 'bitacoras_renta')}
      >
        <TabPanel tabKey="plantilla">
          {initialLoading ? (
            <LoadingState text="Cargando trabajadores..." size="lg" />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIAS.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRoleChange(r.id)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${selectedRole === r.id ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>

              <SearchBar
                value={search}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                placeholder="Buscar por nombre, puesto o cliente de renta..."
              />

              {trabajadores.length === 0 ? (
                <EmptyState title="Sin resultados" subtitle="No se encontraron empleados para los filtros aplicados." />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trabajadores.map((t) => (
                      <WorkerCard
                        key={t.id}
                        trabajador={t}
                        bitacorasCount={bitacorasCountPorTrabajador[t.id] ?? 0}
                        puedeEditar={puedeEditar}
                        puedeEliminar={puedeEliminar}
                        onOpenBitacoras={handleOpenBitacorasModal}
                        onEdit={openEdit}
                        onLiquidar={handleOpenLiquidacion}
                      />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalRecords={pagination.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          )}
        </TabPanel>

        <TabPanel tabKey="bitacoras_renta">
          <div className="space-y-4">
            <div className="card bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20">
                  Soporte Diario de Cobro a Clientes
                </span>
                <h3 className="text-2xl font-black mt-2">Hojas de Bitácora Diaria y Tareo de Maquinaria</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Partes de trabajo que entregan los operadores con horas efectivas, horómetros y firma del cliente para facturación.
                </p>
              </div>
              <div className="w-full md:w-64">
                <SearchBar value={search} onChange={handleSearchChange} onSearch={handleSearch} placeholder="Buscar por cliente u operador..." />
              </div>
            </div>

            <DataTable
              columns={bitacorasColumns}
              data={bitacorasConcentrado}
              loading={bitacorasLoading}
              keyExtractor={(b) => b.id}
              emptyText="Sin bitácoras registradas."
            />
          </div>
        </TabPanel>
      </Tabs>

      {/* MODAL ALTA/EDICIÓN DE EMPLEADO */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Editar Empleado' : 'Alta de Empleado por Puesto'}
        submitLabel={submitting ? 'Guardando…' : editingId ? 'Guardar Cambios' : 'Dar de Alta'}
        isSubmitting={submitting}
      >
        <div className="space-y-3">
          <ModalField label="Nombre Completo" required>
            <input className={modalInputClass} placeholder="Juan Pérez García" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Categoría de Puesto" required>
              <select className={modalSelectClass} value={form.categoriaPuesto} onChange={(e) => setForm({ ...form, categoriaPuesto: e.target.value as TrabajadorCreateInput['categoriaPuesto'] })}>
                <option value="Operador">Operador de Maquinaria</option>
                <option value="Chofer">Chofer de Transporte</option>
                <option value="Mecanico">Mecánico de Taller</option>
                <option value="Ingeniero">Ingeniero / Encargado</option>
                <option value="Administrativo">Personal Administrativo</option>
              </select>
            </ModalField>
            <ModalField label="Puesto Específico" required>
              <input className={modalInputClass} placeholder="Ej: Operador de Excavadora CAT" value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} />
            </ModalField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Teléfono de Contacto">
              <input className={modalInputClass} placeholder="55 1234 5678" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </ModalField>
            <ModalField label="Hora de Entrada">
              <input type="time" className={modalInputClass} value={form.entrada} onChange={(e) => setForm({ ...form, entrada: e.target.value })} />
            </ModalField>
          </div>

          <ModalField label="Obra Asignada">
            <select className={modalSelectClass} value={form.proyecto} onChange={(e) => setForm({ ...form, proyecto: e.target.value })}>
              <option value="">Sin asignar</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
          </ModalField>

          {(form.categoriaPuesto === 'Operador' || form.categoriaPuesto === 'Chofer') && (
            <ModalField label="Máquina Asignada">
              <select className={modalSelectClass} value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}>
                <option value="">Sin asignar</option>
                {maquinaria.map((m) => (
                  <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
                ))}
              </select>
            </ModalField>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <ModalField label="Sueldo Fiscal (SPEI Tarjeta)">
              <input type="number" className={modalInputClass} value={form.sueldoFiscal} onChange={(e) => setForm({ ...form, sueldoFiscal: e.target.value })} />
            </ModalField>
            <ModalField label="Complemento Efectivo (Sobre)">
              <input type="number" className={modalInputClass} value={form.sueldoEfectivo} onChange={(e) => setForm({ ...form, sueldoEfectivo: e.target.value })} />
            </ModalField>
          </div>
        </div>
      </FormModal>

      {/* MODAL BITÁCORAS DE RENTA */}
      {bitacorasModalOpen && selectedWorkerForBitacora && (
        <BitacorasRentaModal
          isOpen={bitacorasModalOpen}
          onClose={() => setBitacorasModalOpen(false)}
          trabajador={selectedWorkerForBitacora}
          maquinaria={maquinaria}
          puedeCrear={puedeCrear}
          onBitacoraCreada={() => fetchTrabajadores(pagination.page, search, selectedRole)}
        />
      )}

      {/* MODAL LIQUIDACIÓN Y FINIQUITO */}
      {liquidacionModalOpen && (
        <LiquidacionModal
          isOpen={liquidacionModalOpen}
          onClose={() => setLiquidacionModalOpen(false)}
          trabajador={selectedWorkerForLiquidacion}
          onLiquidado={() => fetchTrabajadores(pagination.page, search, selectedRole)}
        />
      )}
    </div>
  );
}
