"use client";

import React, { useMemo, useState } from 'react';
import {
  Plus, FileText, Pencil, Trash2, CreditCard, AlertCircle,
  Truck, ClipboardList, Wallet, ShoppingCart,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal, Modal, ModalHeader, ModalBody, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type CategoriaProveedor = 'Refacciones' | 'Combustible' | 'Materiales' | 'Servicios' | 'Otros';
type EstadoOrden = 'Pendiente' | 'Aprobada' | 'Recibida' | 'Cancelada';

interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  rfc: string;
  telefono: string;
  correo: string;
  categoria: CategoriaProveedor;
}

interface OrdenCompra {
  id: string;
  folio: string;
  proveedorId: string;
  proveedorNombre: string;
  descripcion: string;
  monto: number;
  pagado: number;
  fecha: string;
  estado: EstadoOrden;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

const CATEGORIAS: CategoriaProveedor[] = ['Refacciones', 'Combustible', 'Materiales', 'Servicios', 'Otros'];
const ESTADOS: EstadoOrden[] = ['Pendiente', 'Aprobada', 'Recibida', 'Cancelada'];

const badgeVariant: Record<CategoriaProveedor, 'info' | 'warning' | 'success' | 'neutral' | 'primary'> = {
  Refacciones: 'info',
  Combustible: 'warning',
  Materiales: 'success',
  Servicios: 'neutral',
  Otros: 'primary',
};

const estadoVariant: Record<EstadoOrden, 'warning' | 'info' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Aprobada: 'info',
  Recibida: 'success',
  Cancelada: 'error',
};

// ─── Mock data (fase 1: no existe API de proveedores aún) ─────────────────────
const proveedoresIniciales: Proveedor[] = [
  { id: 'PV001', nombre: 'Refacciones CAT México', contacto: 'Carlos Herrera', rfc: 'HEC780101T3A', telefono: '555-1100', correo: 'cherrera@catmex.com', categoria: 'Refacciones' },
  { id: 'PV002', nombre: 'Lubricantes Especializados', contacto: 'Daniela Ríos', rfc: 'RID820505M91', telefono: '555-2233', correo: 'drios@lubrispec.com', categoria: 'Refacciones' },
  { id: 'PV003', nombre: 'Diésel del Norte', contacto: 'Jorge Sánchez', rfc: 'SAJ911112XK4', telefono: '555-3344', correo: 'jsanchez@diesel.com', categoria: 'Combustible' },
  { id: 'PV004', nombre: 'Michelin México', contacto: 'Lucía Morales', rfc: 'MOL900828PA7', telefono: '555-4455', correo: 'lmorales@michelin.mx', categoria: 'Refacciones' },
];

const ordenesIniciales: OrdenCompra[] = [
  { id: 'OC001', folio: 'OC-2026-001', proveedorId: 'PV001', proveedorNombre: 'Refacciones CAT México', descripcion: 'Filtros de aceite x12 + filtros de aire x6', monto: 8400, pagado: 8400, fecha: '2026-08-10', estado: 'Recibida' },
  { id: 'OC002', folio: 'OC-2026-002', proveedorId: 'PV004', proveedorNombre: 'Michelin México', descripcion: 'Llantas 11R22.5 x4 para volteo', monto: 34000, pagado: 0, fecha: '2026-08-12', estado: 'Aprobada' },
  { id: 'OC003', folio: 'OC-2026-003', proveedorId: 'PV002', proveedorNombre: 'Lubricantes Especializados', descripcion: 'Aceite hidráulico SAW 10W x20 galones', monto: 4200, pagado: 0, fecha: '2026-08-14', estado: 'Pendiente' },
  { id: 'OC004', folio: 'OC-2026-004', proveedorId: 'PV001', proveedorNombre: 'Refacciones CAT México', descripcion: 'Manguera hidráulica 1" x10m + conectores', monto: 12500, pagado: 0, fecha: '2026-08-15', estado: 'Pendiente' },
];

const emptyProvForm = {
  nombre: '',
  contacto: '',
  rfc: '',
  telefono: '',
  correo: '',
  categoria: 'Refacciones' as CategoriaProveedor,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}`;

export default function ProveedoresPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/proveedores');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Datos (fase 1 mock) ──
  const [proveedores, setProveedores] = useState<Proveedor[]>(proveedoresIniciales);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(ordenesIniciales);

  // ── UI state ──
  const [tab, setTab] = useState<'proveedores' | 'ordenes' | 'estados'>('proveedores');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [pageProv, setPageProv] = useState(1);
  const [pageOC, setPageOC] = useState(1);

  // ── Modales ──
  const [provModal, setProvModal] = useState(false);
  const [editProvId, setEditProvId] = useState<string | null>(null);
  const [provForm, setProvForm] = useState(emptyProvForm);
  const [deleteProv, setDeleteProv] = useState<Proveedor | null>(null);
  const [ocModal, setOcModal] = useState(false);
  const [ocForm, setOcForm] = useState({ proveedorId: '', descripcion: '', monto: '' });
  const [abonoOC, setAbonoOC] = useState<OrdenCompra | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [detalleProv, setDetalleProv] = useState<Proveedor | null>(null);

  // ── Derivados / stats ──
  const totalPorPagar = useMemo(
    () => ordenes.reduce((acc, o) => acc + Math.max(0, o.monto - o.pagado), 0),
    [ordenes],
  );
  const ordenesActivas = useMemo(
    () => ordenes.filter((o) => o.estado === 'Pendiente' || o.estado === 'Aprobada').length,
    [ordenes],
  );
  const totalCompras = useMemo(() => ordenes.reduce((acc, o) => acc + o.monto, 0), [ordenes]);

  const saldoProveedor = (proveedorId: string) =>
    ordenes
      .filter((o) => o.proveedorId === proveedorId)
      .reduce((acc, o) => acc + Math.max(0, o.monto - o.pagado), 0);

  const totalComprado = (proveedorId: string) =>
    ordenes
      .filter((o) => o.proveedorId === proveedorId)
      .reduce((acc, o) => acc + o.monto, 0);

  const totalPagado = (proveedorId: string) =>
    ordenes
      .filter((o) => o.proveedorId === proveedorId)
      .reduce((acc, o) => acc + o.pagado, 0);

  /** Ledger del proveedor: una fila por orden, con cargo/abono y saldo corrido. */
  const ledgerDelProveedor = (proveedorId: string) =>
    ordenes
      .filter((o) => o.proveedorId === proveedorId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .reduce<{ o: OrdenCompra; cargo: number; abono: number; saldo: number }[]>((acc, o) => {
        const saldo = (acc.length ? acc[acc.length - 1].saldo : 0) + (o.monto - o.pagado);
        acc.push({ o, cargo: o.monto, abono: o.pagado, saldo });
        return acc;
      }, []);

  // ── Filtros ──
  const activeFilters: ActiveFilter[] = useMemo(
    () =>
      Object.entries(filterValues)
        .filter(([, v]) => v)
        .map(([key, value]) => ({
          key,
          label: key === 'categoria' ? 'Categoría' : 'Estado',
          value,
        })),
    [filterValues],
  );

  const filterFields: FilterField[] =
    tab === 'proveedores'
      ? [{ key: 'categoria', label: 'Categoría', type: 'select', options: CATEGORIAS.map((c) => ({ value: c, label: c })) }]
      : [{ key: 'estado', label: 'Estado', type: 'select', options: ESTADOS.map((e) => ({ value: e, label: e })) }];

  const filteredProv = useMemo(() => {
    const q = search.toLowerCase();
    return proveedores.filter(
      (p) =>
        (p.nombre.toLowerCase().includes(q) || p.contacto.toLowerCase().includes(q)) &&
        (!filterValues.categoria || p.categoria === filterValues.categoria),
    );
  }, [proveedores, search, filterValues]);

  const filteredOC = useMemo(() => {
    const q = search.toLowerCase();
    return ordenes.filter(
      (o) =>
        (o.folio.toLowerCase().includes(q) ||
          o.proveedorNombre.toLowerCase().includes(q) ||
          o.descripcion.toLowerCase().includes(q)) &&
        (!filterValues.estado || o.estado === filterValues.estado),
    );
  }, [ordenes, search, filterValues]);

  const provPaged = filteredProv.slice((pageProv - 1) * PAGE_SIZE, pageProv * PAGE_SIZE);
  const ocPaged = filteredOC.slice((pageOC - 1) * PAGE_SIZE, pageOC * PAGE_SIZE);
  const provTotalPages = Math.max(1, Math.ceil(filteredProv.length / PAGE_SIZE));
  const ocTotalPages = Math.max(1, Math.ceil(filteredOC.length / PAGE_SIZE));

  // ── Handlers: proveedor ──
  const openCreateProv = () => {
    setEditProvId(null);
    setProvForm(emptyProvForm);
    setProvModal(true);
  };

  const openEditProv = (p: Proveedor) => {
    setEditProvId(p.id);
    setProvForm({
      nombre: p.nombre,
      contacto: p.contacto,
      rfc: p.rfc,
      telefono: p.telefono,
      correo: p.correo,
      categoria: p.categoria,
    });
    setProvModal(true);
  };

  const handleGuardarProveedor = () => {
    if (!provForm.nombre.trim() || !provForm.contacto.trim()) {
      showToast('Nombre y contacto son obligatorios.', 'error');
      return;
    }
    if (editProvId) {
      const nombreAnterior = proveedores.find((p) => p.id === editProvId)?.nombre;
      setProveedores((prev) =>
        prev.map((p) => (p.id === editProvId ? { ...provForm, id: p.id } : p)),
      );
      // Mantener consistente el nombre del proveedor en sus órdenes
      if (nombreAnterior && nombreAnterior !== provForm.nombre) {
        setOrdenes((prev) =>
          prev.map((o) =>
            o.proveedorId === editProvId ? { ...o, proveedorNombre: provForm.nombre } : o,
          ),
        );
      }
      setProvModal(false);
      showToast('Proveedor actualizado correctamente.', 'success');
    } else {
      const nuevo: Proveedor = { ...provForm, id: uid('PV') };
      setProveedores((prev) => [nuevo, ...prev]);
      setProvModal(false);
      showToast('Proveedor agregado correctamente.', 'success');
    }
  };

  const handleEliminarProveedor = () => {
    if (!deleteProv) return;
    setProveedores((prev) => prev.filter((p) => p.id !== deleteProv.id));
    setOrdenes((prev) => prev.filter((o) => o.proveedorId !== deleteProv.id));
    showToast('Proveedor eliminado.', 'success');
    setDeleteProv(null);
  };

  // ── Handlers: órdenes de compra ──
  const handleCrearOrden = () => {
    if (!ocForm.proveedorId || !ocForm.descripcion.trim() || !ocForm.monto) {
      showToast('Todos los campos son obligatorios.', 'error');
      return;
    }
    const monto = parseFloat(ocForm.monto);
    if (!monto || monto <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }
    const prov = proveedores.find((p) => p.id === ocForm.proveedorId);
    if (!prov) return;
    const folio = `OC-${new Date().getFullYear()}-${String(ordenes.length + 1).padStart(3, '0')}`;
    const nueva: OrdenCompra = {
      id: uid('OC'),
      folio,
      proveedorId: prov.id,
      proveedorNombre: prov.nombre,
      descripcion: ocForm.descripcion.trim(),
      monto,
      pagado: 0,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'Pendiente',
    };
    setOrdenes((prev) => [nueva, ...prev]);
    setOcModal(false);
    setOcForm({ proveedorId: '', descripcion: '', monto: '' });
    showToast('Orden de compra creada correctamente.', 'success');
  };

  const handleAbono = () => {
    if (!abonoOC) return;
    const abono = parseFloat(montoAbono);
    const pendiente = abonoOC.monto - abonoOC.pagado;
    if (!abono || abono <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }
    if (abono > pendiente) {
      showToast(`El abono no puede superar el saldo pendiente (${formatCurrency(pendiente)}).`, 'error');
      return;
    }
    setOrdenes((prev) =>
      prev.map((o) => {
        if (o.id !== abonoOC.id) return o;
        const nuevoPagado = o.pagado + abono;
        return { ...o, pagado: nuevoPagado, estado: nuevoPagado >= o.monto ? 'Recibida' : o.estado };
      }),
    );
    setMontoAbono('');
    setAbonoOC(null);
    showToast(`Abono de ${formatCurrency(abono)} registrado.`, 'success');
  };

  // ── Handlers: búsqueda y filtros ──
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    setPageProv(1);
    setPageOC(1);
  };

  const handleRemoveFilter = (key: string) => handleFilterChange(key, '');
  const handleClearFilters = () => {
    setFilterValues({});
    setPageProv(1);
    setPageOC(1);
  };

  // ── Columnas DataTable: proveedores ──
  const proveedorColumns: Column<Proveedor>[] = [
    {
      key: 'nombre',
      header: 'Proveedor',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
            {p.nombre[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs truncate">{p.nombre}</p>
            <p className="text-[10px] text-slate-500 font-medium">{p.contacto}</p>
          </div>
        </div>
      ),
    },
    { key: 'rfc', header: 'RFC', render: (p) => <span className="text-xs font-medium text-slate-500">{p.rfc || '—'}</span> },
    { key: 'contacto', header: 'Contacto', render: (p) => <span className="text-xs font-medium text-slate-600">{p.telefono || '—'}</span> },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (p) => (
        <Badge variant={badgeVariant[p.categoria]} size="sm">
          {p.categoria}
        </Badge>
      ),
    },
    {
      key: 'saldo',
      header: 'Saldo Pendiente',
      align: 'right',
      render: (p) => {
        const saldo = saldoProveedor(p.id);
        return (
          <span className={`text-xs font-black ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(saldo)}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Total Compras',
      align: 'right',
      render: (p) => <span className="text-xs font-black text-slate-700">{formatCurrency(totalComprado(p.id))}</span>,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          {puedeEditar && (
            <Button variant="secondary" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditProv(p)}>
              Editar
            </Button>
          )}
          {puedeEliminar && (
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteProv(p)}>
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Columnas DataTable: órdenes ──
  const ordenColumns: Column<OrdenCompra>[] = [
    { key: 'folio', header: 'Folio', render: (o) => <span className="font-black text-primary text-xs">{o.folio}</span> },
    {
      key: 'proveedor',
      header: 'Proveedor',
      render: (o) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
            {o.proveedorNombre[0]}
          </div>
          <span className="font-bold text-slate-700 text-xs">{o.proveedorNombre}</span>
        </div>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (o) => <p className="text-xs text-slate-600 font-medium max-w-[220px] truncate">{o.descripcion}</p>,
    },
    { key: 'fecha', header: 'Fecha', render: (o) => <span className="text-xs font-medium text-slate-500">{o.fecha}</span> },
    { key: 'monto', header: 'Monto', align: 'right', render: (o) => <span className="text-xs font-black text-slate-900">{formatCurrency(o.monto)}</span> },
    {
      key: 'pagado',
      header: 'Pagado',
      align: 'right',
      render: (o) => (
        <div>
          <div className="font-black text-green-600 text-xs">{formatCurrency(o.pagado)}</div>
          {o.monto - o.pagado > 0 && (
            <div className="text-[10px] text-red-500 font-bold">Resta: {formatCurrency(o.monto - o.pagado)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (o) => (
        <div className="flex justify-center">
          <Badge variant={estadoVariant[o.estado]} size="sm">
            {o.estado}
          </Badge>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (o) =>
        o.monto - o.pagado > 0 && puedeEditar ? (
          <Button variant="outline" size="sm" icon={<CreditCard className="w-3.5 h-3.5" />} onClick={() => { setMontoAbono(''); setAbonoOC(o); }}>
            Abonar
          </Button>
        ) : null,
    },
  ];

  // ── Columnas DataTable: estados de cuenta (resumen por proveedor) ──
  const estadoResumenColumns: Column<Proveedor>[] = [
    {
      key: 'proveedor',
      header: 'Proveedor',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
            {p.nombre[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs truncate">{p.nombre}</p>
            <p className="text-[10px] text-slate-500 font-medium">{p.contacto}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'operaciones',
      header: 'Operaciones',
      align: 'center',
      render: (p) => {
        const count = ordenes.filter((o) => o.proveedorId === p.id).length;
        return <Badge variant="neutral" size="sm">{count}</Badge>;
      },
    },
    { key: 'total', header: 'Total Compras', align: 'right', render: (p) => <span className="text-xs font-black text-slate-700">{formatCurrency(totalComprado(p.id))}</span> },
    { key: 'pagado', header: 'Pagado', align: 'right', render: (p) => <span className="text-xs font-black text-green-600">{formatCurrency(totalPagado(p.id))}</span> },
    {
      key: 'saldo',
      header: 'Saldo Pendiente',
      align: 'right',
      render: (p) => {
        const saldo = saldoProveedor(p.id);
        return (
          <span className={`text-xs font-black ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(saldo)}
          </span>
        );
      },
    },
  ];

  // ── Columnas DataTable: ledger detalle de un proveedor ──
  const ledgerColumns: Column<{ o: OrdenCompra; cargo: number; abono: number; saldo: number }>[] = [
    { key: 'fecha', header: 'Fecha', render: (r) => <span className="text-xs font-medium text-slate-500">{r.o.fecha}</span> },
    { key: 'folio', header: 'Folio', render: (r) => <span className="font-black text-primary text-xs">{r.o.folio}</span> },
    { key: 'concepto', header: 'Concepto', render: (r) => <p className="text-xs text-slate-600 font-medium max-w-[200px] truncate">{r.o.descripcion}</p> },
    { key: 'cargo', header: 'Cargo', align: 'right', render: (r) => <span className="text-xs font-bold text-slate-700">{formatCurrency(r.cargo)}</span> },
    { key: 'abono', header: 'Abono', align: 'right', render: (r) => <span className="text-xs font-bold text-green-600">{formatCurrency(r.abono)}</span> },
    {
      key: 'saldo',
      header: 'Saldo',
      align: 'right',
      render: (r) => (
        <span className={`text-xs font-black ${r.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(r.saldo)}
        </span>
      ),
    },
  ];

  const proveedoresConOperaciones = proveedores.filter((p) => ordenes.some((o) => o.proveedorId === p.id));

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Proveedores"
        subtitle="Órdenes de compra, pagos y estados de cuenta."
        action={
          puedeCrear ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={<FileText className="w-4 h-4" />} onClick={() => setOcModal(true)}>
                Nueva Orden
              </Button>
              <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={openCreateProv}>
                Proveedor
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<Wallet className="w-6 h-6" />}
          value={formatCurrency(totalPorPagar)}
          label="Por Pagar"
          color={totalPorPagar > 0 ? 'error' : 'success'}
        />
        <StatsCard
          icon={<ClipboardList className="w-6 h-6" />}
          value={`${ordenesActivas} activas`}
          label="Órdenes Activas"
          color="info"
        />
        <StatsCard
          icon={<ShoppingCart className="w-6 h-6" />}
          value={formatCurrency(totalCompras)}
          label="Total Compras"
          color="neutral"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { key: 'proveedores', label: 'Proveedores', icon: <Truck className="w-4 h-4" />, count: proveedores.length },
          { key: 'ordenes', label: 'Órdenes de Compra', icon: <FileText className="w-4 h-4" />, count: ordenes.length },
          { key: 'estados', label: 'Estados de Cuenta', icon: <Wallet className="w-4 h-4" /> },
        ]}
        value={tab}
        onChange={(key) => {
          setTab(key as 'proveedores' | 'ordenes' | 'estados');
          setSearch('');
          setFilterValues({});
          setPageProv(1);
          setPageOC(1);
        }}
      >
        {/* ─── PROVEEDORES ─────────────────────────────────────────────── */}
        <TabPanel tabKey="proveedores">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Buscar proveedor o contacto..."
                className="flex-1"
                filters={filterFields}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onRemoveFilter={handleRemoveFilter}
              />
            </div>

            {filteredProv.length === 0 ? (
              <EmptyState
                title="Sin proveedores"
                subtitle="No se encontraron proveedores para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={proveedorColumns}
                  data={provPaged}
                  keyExtractor={(p) => p.id}
                  emptyText="No se encontraron proveedores."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={pageProv}
                  totalPages={provTotalPages}
                  totalRecords={filteredProv.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPageProv}
                />
              </>
            )}
          </div>
        </TabPanel>

        {/* ─── ÓRDENES DE COMPRA ───────────────────────────────────────── */}
        <TabPanel tabKey="ordenes">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Buscar folio, proveedor o descripción..."
                className="flex-1"
                filters={filterFields}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onRemoveFilter={handleRemoveFilter}
              />
            </div>

            {filteredOC.length === 0 ? (
              <EmptyState
                title="Sin órdenes de compra"
                subtitle="No se encontraron órdenes para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={ordenColumns}
                  data={ocPaged}
                  keyExtractor={(o) => o.id}
                  emptyText="No se encontraron órdenes de compra."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={pageOC}
                  totalPages={ocTotalPages}
                  totalRecords={filteredOC.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPageOC}
                />
              </>
            )}
          </div>
        </TabPanel>

        {/* ─── ESTADOS DE CUENTA ───────────────────────────────────────── */}
        <TabPanel tabKey="estados">
          {proveedoresConOperaciones.length === 0 ? (
            <EmptyState title="Sin operaciones" subtitle="Aún no hay órdenes de compra registradas." />
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Haz clic en un proveedor para ver el detalle del estado de cuenta (saldo corrido por operación).
              </p>
              <DataTable
                columns={estadoResumenColumns}
                data={proveedoresConOperaciones}
                keyExtractor={(p) => p.id}
                onRowClick={setDetalleProv}
                emptyText="Sin proveedores con operaciones."
                maxBodyHeight="500px"
              />
            </div>
          )}
        </TabPanel>
      </Tabs>

      {/* ─── Modal Nuevo/Editar Proveedor ───────────────────────────────── */}
      <FormModal
        open={provModal}
        onClose={() => setProvModal(false)}
        onCancel={() => setProvModal(false)}
        title={editProvId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        subtitle={editProvId ? 'Actualiza los datos del proveedor.' : 'Registrar un nuevo proveedor.'}
        submitLabel={editProvId ? 'Guardar Cambios' : 'Agregar Proveedor'}
        cancelLabel="Cancelar"
        onSubmit={handleGuardarProveedor}
      >
        <ModalField label="Nombre / Razón social" required>
          <input
            type="text"
            className={modalInputClass}
            placeholder="Refacciones CAT México"
            value={provForm.nombre}
            onChange={(e) => setProvForm({ ...provForm, nombre: e.target.value })}
          />
        </ModalField>
        <ModalField label="Contacto" required>
          <input
            type="text"
            className={modalInputClass}
            placeholder="Nombre del contacto"
            value={provForm.contacto}
            onChange={(e) => setProvForm({ ...provForm, contacto: e.target.value })}
          />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="RFC">
            <input
              type="text"
              className={modalInputClass}
              placeholder="XXX000000XX0"
              value={provForm.rfc}
              onChange={(e) => setProvForm({ ...provForm, rfc: e.target.value })}
            />
          </ModalField>
          <ModalField label="Categoría">
            <select
              className={modalSelectClass}
              value={provForm.categoria}
              onChange={(e) => setProvForm({ ...provForm, categoria: e.target.value as CategoriaProveedor })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </ModalField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Teléfono">
            <input
              type="text"
              className={modalInputClass}
              placeholder="555-0000"
              value={provForm.telefono}
              onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })}
            />
          </ModalField>
          <ModalField label="Correo">
            <input
              type="email"
              className={modalInputClass}
              placeholder="correo@empresa.com"
              value={provForm.correo}
              onChange={(e) => setProvForm({ ...provForm, correo: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* ─── Modal Nueva Orden de Compra ───────────────────────────────── */}
      <FormModal
        open={ocModal}
        onClose={() => setOcModal(false)}
        onCancel={() => setOcModal(false)}
        title="Nueva Orden de Compra"
        subtitle="Registrar una nueva orden para un proveedor."
        submitLabel="Crear Orden"
        cancelLabel="Cancelar"
        onSubmit={handleCrearOrden}
      >
        <ModalField label="Proveedor" required>
          <select
            className={modalSelectClass}
            value={ocForm.proveedorId}
            onChange={(e) => setOcForm({ ...ocForm, proveedorId: e.target.value })}
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Descripción" required>
          <input
            type="text"
            className={modalInputClass}
            placeholder="Filtros de aceite x12, aceite SAE 15W-40..."
            value={ocForm.descripcion}
            onChange={(e) => setOcForm({ ...ocForm, descripcion: e.target.value })}
          />
        </ModalField>
        <ModalField label="Monto Total (MXN)" required>
          <input
            type="number"
            min="0"
            step="0.01"
            className={modalInputClass}
            placeholder="5000"
            value={ocForm.monto}
            onChange={(e) => setOcForm({ ...ocForm, monto: e.target.value })}
          />
        </ModalField>
      </FormModal>

      {/* ─── Modal Abono ────────────────────────────────────────────────── */}
      <FormModal
        open={!!abonoOC}
        onClose={() => { setAbonoOC(null); setMontoAbono(''); }}
        onCancel={() => { setAbonoOC(null); setMontoAbono(''); }}
        title="Registrar Abono"
        subtitle="Aplicar un pago parcial o total a la orden."
        submitLabel="Registrar Pago"
        cancelLabel="Cancelar"
        onSubmit={handleAbono}
      >
        {abonoOC && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
            <p className="font-bold text-slate-700">{abonoOC.proveedorNombre}</p>
            <p className="text-slate-500 text-xs">{abonoOC.folio} — {abonoOC.descripcion}</p>
            <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-500 text-xs">Pendiente por pagar</span>
              <span className="font-black text-red-600">{formatCurrency(abonoOC.monto - abonoOC.pagado)}</span>
            </div>
          </div>
        )}
        <ModalField label="Monto a Abonar (MXN)" required>
          <input
            type="number"
            min="0"
            step="0.01"
            className={modalInputClass}
            placeholder="0.00"
            value={montoAbono}
            onChange={(e) => setMontoAbono(e.target.value)}
          />
        </ModalField>
      </FormModal>

      {/* ─── Modal Confirmar Eliminación ───────────────────────────────── */}
      <FormModal
        open={!!deleteProv}
        onClose={() => setDeleteProv(null)}
        onCancel={() => setDeleteProv(null)}
        title="Eliminar Proveedor"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleEliminarProveedor}
      >
        {deleteProv && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">¿Estás seguro de eliminar el proveedor?</p>
            <p className="font-black text-slate-900 text-lg mb-2">{deleteProv.nombre}</p>
            <p className="text-xs text-slate-500">
              Se eliminarán también sus {ordenes.filter((o) => o.proveedorId === deleteProv.id).length} órdenes de compra.
            </p>
          </div>
        )}
      </FormModal>

      {/* ─── Modal Estado de Cuenta (ledger detalle) ───────────────────── */}
      <Modal open={!!detalleProv} onClose={() => setDetalleProv(null)} size="lg">
        {detalleProv && (
          <>
            <ModalHeader
              title={detalleProv.nombre}
              subtitle={`Estado de cuenta — ${detalleProv.contacto} · ${detalleProv.rfc || 'Sin RFC'}`}
              onClose={() => setDetalleProv(null)}
            />
            <ModalBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total compras</p>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(totalComprado(detalleProv.id))}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Pagado</p>
                    <p className="text-lg font-black text-green-700">{formatCurrency(totalPagado(detalleProv.id))}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Saldo pendiente</p>
                    <p className={`text-lg font-black ${saldoProveedor(detalleProv.id) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(saldoProveedor(detalleProv.id))}
                    </p>
                  </div>
                </div>
                <DataTable
                  columns={ledgerColumns}
                  data={ledgerDelProveedor(detalleProv.id)}
                  keyExtractor={(r) => r.o.id}
                  emptyText="Sin operaciones registradas."
                  maxBodyHeight="320px"
                />
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </div>
  );
}