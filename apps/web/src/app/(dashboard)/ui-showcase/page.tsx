"use client";

import { useState } from "react";
import {
  Plus, Save, Trash2, Edit, Search, Download, Filter,
  Users, Truck, HardHat, FileText, DollarSign, TrendingUp,
  AlertCircle, CheckCircle, Clock, Eye, Settings,
  LayoutDashboard, Mail, Phone, MapPin, Calendar,
  BarChart3, Activity, Loader2, Upload, Copy, Printer,
  RefreshCw, ExternalLink, Share2, Link, Unlock, Lock,
  Send, Zap, Star, Heart, Archive, RotateCcw, PencilLine,
  CircleCheck, CircleX, CircleAlert, Info, CheckCircle2,
  Map, MapPinned, MapPinCheck, MapPinHouse, MapPinSearch, MapPlus,
  Fuel, Droplet, Droplets, Flame,
  Locate, LocateFixed, Navigation, Compass, Globe, Route, Road, Signpost,
  Forklift, Wrench, Hammer, Drill, Shovel,
  Package, PackageCheck, PackagePlus, Box, Boxes, PackageOpen, PackageSearch,
  Ruler, PencilRuler, DraftingCompass, Scale, Weight, Gauge, Thermometer,
  Trees, Mountain, Earth, Snowflake, Wind, CloudSun,
  SlidersHorizontal,
  Bell, BellDot, BellRing, BellOff,
  Timer, ClipboardList, ShieldAlert, Building2, ShoppingCart, CreditCard, FileBadge,
  Banknote, Layers,
  AlertTriangle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatsCard } from "@/components/ui/StatsCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";
import { DataTable, type Column as DataTableColumn } from "@/components/ui/DataTable";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from "@/components/ui/Modal";
import { useToast } from "@/components/layout/Toast";
import type { ToastPosition, ToastTransition } from "@/components/layout/Toast.types";
import { Stack } from "@/components/ui/Stack";
import { Container } from "@/components/ui/Container";
import { Grid } from "@/components/ui/Grid";
import { Center } from "@/components/ui/Center";
import { Spacer } from "@/components/ui/Spacer";
import { Flex, Row, Column } from "@/components/ui/Flex";
import { AspectRatio } from "@/components/ui/AspectRatio";
import { SkeletonText } from "@/components/ui/SkeletonText";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { Show, Hide } from "@/components/ui/Show";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { Box as BoxLayout } from "@/components/ui/Box";
import { Collapse } from "@/components/ui/Collapse";
import { Portal } from "@/components/ui/Portal";
import { Overlay } from "@/components/ui/Overlay";
import { Pagination } from "@/components/ui/Pagination";
import { Divider } from "@/components/ui/Divider";
import { LiveIndicator, StatusBadge, GpsMap, MachineList } from "@/components/ui/GpsTracking";
import type { GpsMachine, MachineStatus } from "@/components/ui/GpsTracking";
import { SearchBar, FilterPanel, ActiveFilters } from "@/components/ui/SearchBar";
import type { FilterField, ActiveFilter } from "@/components/ui/SearchBar";
import { BarChart, LineChart, AreaChart, PieChart, DoughnutChart, RadarChartComponent, RadialBarChartComponent, ScatterChartComponent } from "@/components/ui/Charts";

/* ────────────────────────────────────────────────────────────────
   Mock data
   ──────────────────────────────────────────────────────────────── */

const sampleOptions = [
  { value: "opt1", label: "Opcion 1" },
  { value: "opt2", label: "Opcion 2" },
  { value: "opt3", label: "Opcion 3" },
];

const sampleWorkers = [
  { id: "1", nombre: "Carlos Hernandez", puesto: "Operador", estado: "Activo", telefono: "55 1234 5678", rfc: "HERC850101ABC", sueldoFiscal: 12500, sueldoEfectivo: 8500, fechaIngreso: "15/03/2021", bodega: "Bodega Central" },
  { id: "2", nombre: "Maria Lopez", puesto: "Tecnico", estado: "Inactivo", telefono: "55 8765 4321", rfc: "LOPM900515DEF", sueldoFiscal: 15000, sueldoEfectivo: 10500, fechaIngreso: "22/07/2022", bodega: "Bodega Norte" },
  { id: "3", nombre: "Juan Perez", puesto: "Supervisor", estado: "Activo", telefono: "55 1122 3344", rfc: "PEPJ750820GHI", sueldoFiscal: 18000, sueldoEfectivo: 13000, fechaIngreso: "10/01/2020", bodega: "Bodega Central" },
  { id: "4", nombre: "Ana Garcia", puesto: "Mecanico", estado: "Permiso", telefono: "55 5566 7788", rfc: "GARA880305JKL", sueldoFiscal: 14000, sueldoEfectivo: 9800, fechaIngreso: "05/11/2023", bodega: "Bodega Sur" },
  { id: "5", nombre: "Roberto Diaz", puesto: "Operador", estado: "Activo", telefono: "55 9900 1122", rfc: "DIRR920612MNO", sueldoFiscal: 12500, sueldoEfectivo: 8500, fechaIngreso: "18/09/2021", bodega: "Bodega Central" },
  { id: "6", nombre: "Laura Martinez", puesto: "Chofer", estado: "Activo", telefono: "55 3344 5566", rfc: "MABL850228PQR", sueldoFiscal: 11000, sueldoEfectivo: 7800, fechaIngreso: "01/06/2022", bodega: "Bodega Norte" },
  { id: "7", nombre: "Miguel Santos", puesto: "Mecanico", estado: "Inactivo", telefono: "55 7788 9900", rfc: "SARM790415STU", sueldoFiscal: 14000, sueldoEfectivo: 9800, fechaIngreso: "12/02/2020", bodega: "Bodega Sur" },
  { id: "8", nombre: "Sofia Ramirez", puesto: "Oficinista", estado: "Activo", telefono: "55 2233 4455", rfc: "RASS910830VWX", sueldoFiscal: 13000, sueldoEfectivo: 9200, fechaIngreso: "25/12/2023", bodega: "Bodega Central" },
];

interface WorkerRow {
  id: string;
  nombre: string;
  puesto: string;
  estado: string;
  telefono: string;
  rfc: string;
  sueldoFiscal: number;
  sueldoEfectivo: number;
  fechaIngreso: string;
  bodega: string;
}

const workerColumns: DataTableColumn<WorkerRow>[] = [
  { key: "nombre", header: "Nombre Completo", minWidth: "200px" },
  { key: "puesto", header: "Puesto", minWidth: "130px" },
  { key: "telefono", header: "Telefono", minWidth: "130px", nowrap: true },
  { key: "rfc", header: "RFC", minWidth: "140px", nowrap: true },
  {
    key: "sueldoFiscal",
    header: "Sueldo Fiscal",
    minWidth: "130px",
    align: "right",
    nowrap: true,
    render: (row) => (
      <span className="font-semibold text-slate-800">
        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(row.sueldoFiscal)}
      </span>
    ),
  },
  {
    key: "sueldoEfectivo",
    header: "Sueldo Efectivo",
    minWidth: "130px",
    align: "right",
    nowrap: true,
    render: (row) => (
      <span className="font-semibold text-green-600">
        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(row.sueldoEfectivo)}
      </span>
    ),
  },
  { key: "fechaIngreso", header: "Fecha Ingreso", minWidth: "120px", nowrap: true },
  { key: "bodega", header: "Bodega", minWidth: "140px" },
  {
    key: "estado",
    header: "Estado",
    minWidth: "110px",
    render: (row) => (
      <Badge
        variant={
          row.estado === "Activo"
            ? "success"
            : row.estado === "Inactivo"
              ? "error"
              : "warning"
        }
        dot
      >
        {row.estado}
      </Badge>
    ),
  },
  {
    key: "acciones",
    header: "Acciones",
    minWidth: "220px",
    nowrap: true,
    render: () => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="info" size="sm" icon={<Eye size={14} />}>
          Ver
        </Button>
        <Button variant="warning" size="sm" icon={<PencilLine size={14} />}>
          Editar
        </Button>
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />}>
          Eliminar
        </Button>
      </div>
    ),
  },
];

/* ── GPS Mock Data ── */

const mockMachines: GpsMachine[] = [
  {
    id: 'exc-001',
    name: 'EXC-001',
    type: 'Excavadora CAT 320',
    status: 'moving',
    lat: 19.4326,
    lng: -99.1332,
    speed: 12,
    heading: 45,
    fuel: 78,
    temperature: 82,
    hours: 2450,
    lastUpdate: 'Hace 5s',
    operator: 'Carlos Hernandez',
    project: 'Proyecto Reforma',
  },
  {
    id: 'bul-002',
    name: 'BUL-002',
    type: 'Bulldozer D6',
    status: 'idle',
    lat: 19.4356,
    lng: -99.1362,
    speed: 0,
    heading: 0,
    fuel: 45,
    temperature: 75,
    hours: 1820,
    lastUpdate: 'Hace 2m',
    operator: 'Maria Lopez',
    project: 'Proyecto Reforma',
  },
  {
    id: 'cam-003',
    name: 'CAM-003',
    type: 'Camion Volvo A30G',
    status: 'moving',
    lat: 19.4296,
    lng: -99.1302,
    speed: 35,
    heading: 180,
    fuel: 92,
    temperature: 78,
    hours: 3100,
    lastUpdate: 'Hace 3s',
    operator: 'Juan Perez',
    project: 'Puente Viaducto',
  },
  {
    id: 'gru-004',
    name: 'GRU-004',
    type: 'Grúa Liebherr LTM 1100',
    status: 'alert',
    lat: 19.4386,
    lng: -99.1392,
    speed: 0,
    heading: 90,
    fuel: 15,
    temperature: 95,
    hours: 4200,
    lastUpdate: 'Hace 10s',
    operator: 'Ana Garcia',
    project: 'Torre Santa Fe',
  },
  {
    id: 'ret-005',
    name: 'RET-005',
    type: 'Retroexcavadora CAT 420',
    status: 'offline',
    lat: 19.4266,
    lng: -99.1272,
    speed: 0,
    heading: 0,
    fuel: 0,
    temperature: 0,
    hours: 980,
    lastUpdate: 'Hace 3h',
    operator: undefined,
    project: undefined,
  },
  {
    id: 'cil-006',
    name: 'CIL-006',
    type: 'Compactadora CAT CS56',
    status: 'moving',
    lat: 19.4316,
    lng: -99.1352,
    speed: 8,
    heading: 270,
    fuel: 65,
    temperature: 79,
    hours: 1560,
    lastUpdate: 'Hace 2s',
    operator: 'Roberto Diaz',
    project: 'Periférico Sur',
  },
];

/* ────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────── */

export default function UIShowcasePage() {
  const [activeTab, setActiveTab] = useState("general");
  const [searchValue, setSearchValue] = useState("");
  const toast = useToast();

  // Modal states
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast demo states
  const [toastPosition, setToastPosition] = useState<ToastPosition>("top-right");
  const [toastTransition, setToastTransition] = useState<ToastTransition>("fadeIn");

  // GPS demo state
  const [selectedMachine, setSelectedMachine] = useState<GpsMachine | null>(mockMachines[0]);

  // SearchBar demo states
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilters, setTableFilters] = useState<Record<string, string>>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [collapseOpen, setCollapseOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const searchFilters: FilterField[] = [
    {
      key: "puesto",
      label: "Puesto",
      type: "select",
      options: [
        { value: "Operador", label: "Operador" },
        { value: "Tecnico", label: "Tecnico" },
        { value: "Supervisor", label: "Supervisor" },
        { value: "Mecanico", label: "Mecanico" },
        { value: "Chofer", label: "Chofer" },
        { value: "Oficinista", label: "Oficinista" },
      ],
    },
    {
      key: "estado",
      label: "Estado",
      type: "select",
      options: [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
        { value: "Permiso", label: "Permiso" },
      ],
    },
    {
      key: "bodega",
      label: "Bodega",
      type: "select",
      options: [
        { value: "Bodega Central", label: "Bodega Central" },
        { value: "Bodega Norte", label: "Bodega Norte" },
        { value: "Bodega Sur", label: "Bodega Sur" },
      ],
    },
  ];

  const activeTableFilters: ActiveFilter[] = Object.entries(tableFilters)
    .filter(([, v]) => v !== "")
    .map(([key, value]) => ({
      key,
      label: searchFilters.find((f) => f.key === key)?.label || key,
      value,
    }));

  const filteredWorkers = sampleWorkers.filter((w) => {
    // Text search
    if (tableSearch) {
      const search = tableSearch.toLowerCase();
      const match = w.nombre.toLowerCase().includes(search) ||
        w.puesto.toLowerCase().includes(search) ||
        w.rfc.toLowerCase().includes(search) ||
        w.telefono.includes(search);
      if (!match) return false;
    }
    // Filter by puesto
    if (tableFilters.puesto && w.puesto !== tableFilters.puesto) return false;
    // Filter by estado
    if (tableFilters.estado && w.estado !== tableFilters.estado) return false;
    // Filter by bodega
    if (tableFilters.bodega && w.bodega !== tableFilters.bodega) return false;
    return true;
  });

  const handleFormSubmit = () => {
    setFormSubmitting(true);
    setTimeout(() => {
      setFormSubmitting(false);
      setFormModalOpen(false);
    }, 1500);
  };

  const fireToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages: Record<string, string> = {
      success: 'Trabajador guardado correctamente',
      error: 'Error al eliminar el registro',
      warning: 'Campos obligatorios vacios',
      info: 'Datos actualizados del servidor',
    };
    toast.showToast(messages[type], type, {
      position: toastPosition,
      transition: toastTransition,
      progress: true,
    });
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* ── PageHeader ───────────────────────────────────────────── */}
      <PageHeader
        title="UI Showcase - Componentes Reutilizables"
        subtitle="Catalogo visual de todos los componentes del diseno SVR-ERP"
        action={
          <Button icon={<Download size={16} />} variant="outline">
            Exportar
          </Button>
        }
      />

      {/* ── Paleta de Colores ──────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Paleta de Colores
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Colores de Marca
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { name: 'Primary', value: '#ed8238', tailwind: 'primary' },
                { name: 'Primary Dark', value: '#d96e28', tailwind: 'primary-dark' },
                { name: 'Primary Light', value: '#f5a860', tailwind: 'primary-light' },
                { name: 'Secondary', value: '#1e293b', tailwind: 'secondary' },
                { name: 'Sidebar', value: '#1e293b', tailwind: 'sidebar' },
              ].map((color) => (
                <div key={color.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full h-16 rounded-xl shadow-sm border border-slate-100"
                    style={{ backgroundColor: color.value }}
                  />
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{color.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{color.value}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Colores Semanticos
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[
                { name: 'Success', value: '#3d9b6e', dark: '#2f7d56' },
                { name: 'Warning', value: '#d4963a', dark: '#b87e2c' },
                { name: 'Error', value: '#c75450', dark: '#a93e3a' },
                { name: 'Info', value: '#557fb5', dark: '#4569a0' },
              ].map((color) => (
                <div key={color.name} className="flex flex-col items-center gap-2">
                  <div className="flex w-full h-16 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="flex-1" style={{ backgroundColor: color.value }} />
                    <div className="flex-1" style={{ backgroundColor: color.dark }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{color.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{color.value}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Uso de Colores Semanticos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-xs font-bold text-green-700">Crear / Success</p>
                <p className="text-[10px] text-green-600 mt-1">Nuevos registros, confirmaciones</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-700">Editar / Warning</p>
                <p className="text-[10px] text-amber-600 mt-1">Modificaciones, pendientes</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-700">Eliminar / Error</p>
                <p className="text-[10px] text-red-600 mt-1">Eliminaciones, errores criticos</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-xs font-bold text-blue-700">Ver / Info</p>
                <p className="text-[10px] text-blue-600 mt-1">Detalles, informativos</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Buttons ──────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Botones
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Variantes
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="info">Info</Button>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Acciones CRUD (Colores Semanticos)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="success" icon={<Plus size={16} />}>
                Crear
              </Button>
              <Button variant="warning" icon={<PencilLine size={16} />}>
                Editar
              </Button>
              <Button variant="danger" icon={<Trash2 size={16} />}>
                Eliminar
              </Button>
              <Button variant="info" icon={<Eye size={16} />}>
                Ver Detalle
              </Button>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Con Iconos
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button icon={<Plus size={16} />}>Nuevo Registro</Button>
              <Button icon={<Save size={16} />} iconPosition="right">
                Guardar Cambios
              </Button>
              <Button variant="danger" icon={<Trash2 size={16} />}>
                Eliminar
              </Button>
              <Button variant="outline" icon={<Download size={16} />}>
                Descargar
              </Button>
              <Button variant="success" icon={<Upload size={16} />}>
                Subir Archivo
              </Button>
              <Button variant="warning" icon={<Edit size={16} />}>
                Modificar
              </Button>
              <Button variant="info" icon={<Eye size={16} />}>
                Ver Detalle
              </Button>
              <Button variant="outline" icon={<Printer size={16} />}>
                Imprimir
              </Button>
              <Button variant="ghost" icon={<Copy size={16} />}>
                Copiar
              </Button>
              <Button variant="ghost" icon={<Share2 size={16} />}>
                Compartir
              </Button>
              <Button variant="outline" icon={<ExternalLink size={16} />}>
                Abrir
              </Button>
              <Button variant="outline" icon={<RefreshCw size={16} />}>
                Actualizar
              </Button>
              <Button variant="outline" icon={<Send size={16} />}>
                Enviar
              </Button>
              <Button variant="outline" icon={<Archive size={16} />}>
                Archivar
              </Button>
              <Button variant="ghost" icon={<RotateCcw size={16} />}>
                Restaurar
              </Button>
              <Button variant="outline" icon={<Link size={16} />}>
                Copiar Enlace
              </Button>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Iconos por Tamano
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" icon={<Plus size={14} />}>Small</Button>
              <Button size="md" icon={<Plus size={16} />}>Medium</Button>
              <Button size="lg" icon={<Plus size={18} />}>Large</Button>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Tamanos
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Estados
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button loading>Cargando</Button>
              <Button disabled>Deshabilitado</Button>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Full Width
            </h3>
            <Button fullWidth icon={<Settings size={16} />}>
              Configuracion Completa
            </Button>
          </div>
        </Card>
      </section>

      {/* ── Iconos ──────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Iconos - Catalogo lucide-react
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Acciones CRUD
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Plus size={20} />, name: 'Plus', uso: 'Crear' },
                { icon: <PencilLine size={20} />, name: 'PencilLine', uso: 'Editar' },
                { icon: <Edit size={20} />, name: 'Edit', uso: 'Modificar' },
                { icon: <Trash2 size={20} />, name: 'Trash2', uso: 'Eliminar' },
                { icon: <Eye size={20} />, name: 'Eye', uso: 'Ver' },
                { icon: <Save size={20} />, name: 'Save', uso: 'Guardar' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Navegacion y Enlaces
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <ExternalLink size={20} />, name: 'ExternalLink', uso: 'Abrir enlace' },
                { icon: <Link size={20} />, name: 'Link', uso: 'Copiar enlace' },
                { icon: <Share2 size={20} />, name: 'Share2', uso: 'Compartir' },
                { icon: <Download size={20} />, name: 'Download', uso: 'Descargar' },
                { icon: <Upload size={20} />, name: 'Upload', uso: 'Subir' },
                { icon: <Copy size={20} />, name: 'Copy', uso: 'Copiar' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Estados y Feedback
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <CircleCheck size={20} />, name: 'CircleCheck', uso: 'Exito' },
                { icon: <CircleX size={20} />, name: 'CircleX', uso: 'Error' },
                { icon: <CircleAlert size={20} />, name: 'CircleAlert', uso: 'Alerta' },
                { icon: <Info size={20} />, name: 'InfoCircle', uso: 'Info' },
                { icon: <AlertCircle size={20} />, name: 'AlertCircle', uso: 'Error critico' },
                { icon: <CheckCircle size={20} />, name: 'CheckCircle', uso: 'Completado' },
                { icon: <Info size={20} />, name: 'Info', uso: 'Informacion' },
                { icon: <Loader2 size={20} />, name: 'Loader2', uso: 'Spinner' },
                { icon: <Clock size={20} />, name: 'Clock', uso: 'Tiempo/Pendiente' },
                { icon: <RefreshCw size={20} />, name: 'RefreshCw', uso: 'Refrescar' },
                { icon: <RotateCcw size={20} />, name: 'RotateCcw', uso: 'Restaurar' },
                { icon: <Zap size={20} />, name: 'Zap',uso: 'Accion rapida' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Dominio del Negocio
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Users size={20} />, name: 'Users', uso: 'Trabajadores' },
                { icon: <Truck size={20} />, name: 'Truck', uso: 'Maquinaria' },
                { icon: <HardHat size={20} />, name: 'HardHat', uso: 'Proyectos' },
                { icon: <DollarSign size={20} />, name: 'DollarSign', uso: 'Finanzas' },
                { icon: <TrendingUp size={20} />, name: 'TrendingUp', uso: 'Tendencia+' },
                { icon: <BarChart3 size={20} />, name: 'BarChart3', uso: 'Reportes' },
                { icon: <Activity size={20} />, name: 'Activity', uso: 'Actividad' },
                { icon: <FileText size={20} />, name: 'FileText', uso: 'Documentos' },
                { icon: <Calendar size={20} />, name: 'Calendar', uso: 'Fechas' },
                { icon: <Search size={20} />, name: 'Search', uso: 'Buscar' },
                { icon: <Filter size={20} />, name: 'Filter', uso: 'Filtrar' },
                { icon: <Settings size={20} />, name: 'Settings', uso: 'Configuracion' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Menu Principal
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <LayoutDashboard size={20} />, name: 'LayoutDashboard', uso: 'Dashboard' },
                { icon: <Users size={20} />, name: 'Users', uso: 'Trabajadores' },
                { icon: <Clock size={20} />, name: 'Clock', uso: 'Asistencia' },
                { icon: <Banknote size={20} />, name: 'Banknote', uso: 'Nomina' },
                { icon: <Truck size={20} />, name: 'Truck', uso: 'Flota' },
                { icon: <Timer size={20} />, name: 'Timer', uso: 'Horometro' },
                { icon: <Wrench size={20} />, name: 'Wrench', uso: 'Mantenimiento' },
                { icon: <Fuel size={20} />, name: 'Fuel', uso: 'Combustible' },
                { icon: <MapPin size={20} />, name: 'MapPin', uso: 'GPS' },
                { icon: <ClipboardList size={20} />, name: 'ClipboardList', uso: 'Operaciones' },
                { icon: <ShieldAlert size={20} />, name: 'ShieldAlert', uso: 'Reportes Campo' },
                { icon: <Layers size={20} />, name: 'Layers', uso: 'Criba' },
                { icon: <Package size={20} />, name: 'Package', uso: 'Inventario' },
                { icon: <HardHat size={20} />, name: 'HardHat', uso: 'Proyectos' },
                { icon: <Building2 size={20} />, name: 'Building2', uso: 'Clientes' },
                { icon: <FileText size={20} />, name: 'FileText', uso: 'Cotizaciones' },
                { icon: <Banknote size={20} />, name: 'Banknote', uso: 'Finanzas' },
                { icon: <Truck size={20} />, name: 'Truck', uso: 'Proveedores' },
                { icon: <ShoppingCart size={20} />, name: 'ShoppingCart', uso: 'Punto de Venta' },
                { icon: <CreditCard size={20} />, name: 'CreditCard', uso: 'Cobranza' },
                { icon: <FileBadge size={20} />, name: 'FileBadge', uso: 'Documentacion' },
                { icon: <BarChart3 size={20} />, name: 'BarChart3', uso: 'Reportes' },
                { icon: <Settings size={20} />, name: 'Settings', uso: 'Configuracion' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Notificaciones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Bell size={20} />, name: 'Bell', uso: 'Notificaciones' },
                { icon: <BellDot size={20} />, name: 'BellDot', uso: 'Notificacion nueva' },
                { icon: <BellRing size={20} />, name: 'BellRing', uso: 'Alerta activa' },
                { icon: <BellOff size={20} />, name: 'BellOff', uso: 'Silenciar' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Comunicacion y Acciones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Mail size={20} />, name: 'Mail', uso: 'Correo' },
                { icon: <Phone size={20} />, name: 'Phone', uso: 'Telefono' },
                { icon: <MapPin size={20} />, name: 'MapPin', uso: 'Ubicacion' },
                { icon: <Send size={20} />, name: 'Send', uso: 'Enviar' },
                { icon: <Printer size={20} />, name: 'Printer', uso: 'Imprimir' },
                { icon: <Archive size={20} />, name: 'Archive', uso: 'Archivar' },
                { icon: <Lock size={20} />, name: 'Lock', uso: 'Bloquear' },
                { icon: <Unlock size={20} />, name: 'Unlock', uso: 'Desbloquear' },
                { icon: <Star size={20} />, name: 'Star', uso: 'Favorito' },
                { icon: <Heart size={20} />, name: 'Heart', uso: 'Me gusta' },
                { icon: <LayoutDashboard size={20} />, name: 'LayoutDashboard', uso: 'Dashboard' },
                { icon: <CheckCircle2 size={20} />, name: 'CheckCircle2', uso: 'Confirmado' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Mapas y Ubicaciones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Map size={20} />, name: 'Map', uso: 'Mapa general' },
                { icon: <MapPinned size={20} />, name: 'MapPinned', uso: 'Ubicacion fija' },
                { icon: <MapPinCheck size={20} />, name: 'MapPinCheck', uso: 'Ubicacion verificada' },
                { icon: <MapPinHouse size={20} />, name: 'MapPinHouse', uso: 'Domicilio' },
                { icon: <MapPinSearch size={20} />, name: 'MapPinSearch', uso: 'Buscar ubicacion' },
                { icon: <MapPlus size={20} />, name: 'MapPlus', uso: 'Agregar ubicacion' },
                { icon: <Locate size={20} />, name: 'Locate', uso: 'Localizar' },
                { icon: <LocateFixed size={20} />, name: 'LocateFixed', uso: 'GPS fijo' },
                { icon: <Navigation size={20} />, name: 'Navigation', uso: 'Navegacion' },
                { icon: <Compass size={20} />, name: 'Compass', uso: 'Brujula' },
                { icon: <Globe size={20} />, name: 'Globe', uso: 'Mundo' },
                { icon: <Route size={20} />, name: 'Route', uso: 'Ruta' },
                { icon: <Road size={20} />, name: 'Road', uso: 'Carretera' },
                { icon: <Signpost size={20} />, name: 'Signpost', uso: 'Señal' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Combustible e Hidraulicos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Fuel size={20} />, name: 'Fuel', uso: 'Combustible' },
                { icon: <Droplet size={20} />, name: 'DropletOil', uso: 'Aceite/Gota' },
                { icon: <Droplets size={20} />, name: 'Droplets', uso: 'Liquidos' },
                { icon: <Flame size={20} />, name: 'Flame', uso: 'Fuego/Gas' },
                { icon: <Thermometer size={20} />, name: 'Thermometer', uso: 'Temperatura' },
                { icon: <Gauge size={20} />, name: 'Gauge', uso: 'Presion/Horometro' },
                { icon: <Droplet size={20} />, name: 'Droplet', uso: 'Sin liquido' },
                { icon: <Wind size={20} />, name: 'Wind', uso: 'Viento/Aire' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Maquinaria y Herramientas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Truck size={20} />, name: 'Truck', uso: 'Transporte' },
                { icon: <Forklift size={20} />, name: 'Forklift', uso: 'Montacargas' },
                { icon: <HardHat size={20} />, name: 'HardHat', uso: 'Construccion' },
                { icon: <Wrench size={20} />, name: 'Wrench', uso: 'Llave/Mantenimiento' },
                { icon: <Hammer size={20} />, name: 'Hammer', uso: 'Martillo' },
                { icon: <Drill size={20} />, name: 'Drill', uso: 'Taladro' },
                { icon: <Shovel size={20} />, name: 'Shovel', uso: 'Pala' },
                { icon: <Ruler size={20} />, name: 'Ruler', uso: 'Regla/Medicion' },
                { icon: <PencilRuler size={20} />, name: 'PencilRuler', uso: 'Diseno tecnico' },
                { icon: <DraftingCompass size={20} />, name: 'DraftingCompass', uso: 'Compas' },
                { icon: <Scale size={20} />, name: 'Scale', uso: 'Bascula' },
                { icon: <Weight size={20} />, name: 'Weight', uso: 'Peso' },
                { icon: <Wrench size={20} />, name: 'WrenchOff', uso: 'Sin mantenimiento' },
                { icon: <Wrench size={20} />, name: 'WrenchToolbox', uso: 'Caja de herramientas' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Materiales y Paqueteria
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Package size={20} />, name: 'Package', uso: 'Paquete' },
                { icon: <PackageCheck size={20} />, name: 'PackageCheck', uso: 'Paquete verificado' },
                { icon: <PackagePlus size={20} />, name: 'PackagePlus', uso: 'Agregar paquete' },
                { icon: <PackageOpen size={20} />, name: 'PackageOpen', uso: 'Paquete abierto' },
                { icon: <PackageSearch size={20} />, name: 'PackageSearch', uso: 'Buscar paquete' },
                { icon: <Box size={20} />, name: 'Box', uso: 'Caja' },
                { icon: <Boxes size={20} />, name: 'Boxes', uso: 'Bodega/Almacen' },
                { icon: <Truck size={20} />, name: 'TruckMat', uso: 'Transporte materiales' },
                { icon: <Settings size={20} />, name: 'SettingsFactory', uso: 'Planta/Industrial' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Naturaleza y Clima
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { icon: <Trees size={20} />, name: 'Trees', uso: 'Arbos/Madera' },
                { icon: <Mountain size={20} />, name: 'Mountain', uso: 'Montana' },
                { icon: <Earth size={20} />, name: 'Earth', uso: 'Tierra/Terreno' },
                { icon: <CloudSun size={20} />, name: 'CloudSun', uso: 'Cielo/Exterior' },
                { icon: <Snowflake size={20} />, name: 'Snowflake', uso: 'Nieve/Frio' },
                { icon: <Wind size={20} />, name: 'Wind', uso: 'Viento' },
                { icon: <Droplets size={20} />, name: 'Droplets', uso: 'Lluvia/Agua' },
                { icon: <Flame size={20} />, name: 'Flame', uso: 'Sol/Calor' },
              ].map((item, index) => (
                <div key={`icon-${item.name}-${item.uso}-${index}`} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-700">{item.icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.uso}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* ── Cards ────────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Tarjetas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="sm">
              <p className="text-sm font-semibold text-slate-700">
                Padding Small
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tarjeta con espaciado reducido (p-4).
              </p>
            </Card>

            <Card padding="md">
              <p className="text-sm font-semibold text-slate-700">
                Padding Medium
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tarjeta con espaciado estandar (p-6). Es el valor por defecto.
              </p>
            </Card>

            <Card padding="lg">
              <p className="text-sm font-semibold text-slate-700">
                Padding Large
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tarjeta con espaciado amplio (p-8).
              </p>
            </Card>
          </div>

          <Card interactive padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Eye size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Tarjeta Interactiva
                </p>
                <p className="text-xs text-slate-500">
                  Pasa el cursor para ver el efecto hover.
                </p>
              </div>
            </div>
          </Card>
        </Card>
      </section>

      {/* ── Inputs ───────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Inputs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nombre Completo" placeholder="Escribe tu nombre..." />

            <Input
              label="Correo Electronico"
              placeholder="correo@ejemplo.com"
              icon={<Mail size={16} />}
              iconPosition="left"
            />

            <Input
              label="Telefono"
              placeholder="10 digitos"
              icon={<Phone size={16} />}
              iconPosition="right"
            />

            <Input
              label="Contrasena"
              type="password"
              placeholder="Minimo 8 caracteres"
            />

            <Input
              label="Campo con Error"
              placeholder="Valor invalido"
              error="Este campo es obligatorio"
            />

            <Input label="Campo Deshabilitado" placeholder="No editable" disabled />
          </div>
        </Card>
      </section>

      {/* ── Selects ──────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Selects
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Seleccion Basica"
              options={sampleOptions}
              placeholder="Seleccionar..."
            />

            <Select
              label="Select con Error"
              options={sampleOptions}
              error="Debe seleccionar una opcion"
            />

            <Select
              label="Select Deshabilitado"
              options={sampleOptions}
              disabled
            />
          </div>
        </Card>
      </section>

      {/* ── Badges ───────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Badges
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Variantes
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Con Puntos Indicadores
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary" dot>Activo</Badge>
              <Badge variant="success" dot>Completado</Badge>
              <Badge variant="warning" dot>Pendiente</Badge>
              <Badge variant="error" dot>Error</Badge>
              <Badge variant="info" dot>En Proceso</Badge>
              <Badge variant="neutral" dot>Sin Estado</Badge>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Tamanos
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Avatars ──────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Avatares
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Con Iniciales (Auto-Color)
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name="Carlos Hernandez" />
              <Avatar name="Maria Lopez" />
              <Avatar name="Juan Perez" />
              <Avatar name="Ana Garcia" />
              <Avatar name="Pedro Ramirez" />
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Tamanos
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name="SM" size="sm" />
              <Avatar name="MD" size="md" />
              <Avatar name="LG" size="lg" />
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Colores Explicitos
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name="PR" color="primary" />
              <Avatar name="SU" color="success" />
              <Avatar name="WA" color="warning" />
              <Avatar name="ER" color="error" />
              <Avatar name="IN" color="info" />
              <Avatar name="NE" color="neutral" />
            </div>
          </div>
        </Card>
      </section>

      {/* ── StatsCards ───────────────────────────────────────────── */}
      <section>
        <Card className="space-y-8">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Tarjetas de Estadisticas
          </h2>

          {/* Basic KPIs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              KPIs Generales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={<Users size={22} />}
                value="1,248"
                label="Trabajadores Activos"
                color="primary"
                trend="up"
                trendValue="+12%"
              />
              <StatsCard
                icon={<Truck size={22} />}
                value="36"
                label="Unidades Operando"
                color="success"
                trend="up"
                trendValue="+3"
              />
              <StatsCard
                icon={<DollarSign size={22} />}
                value="$2.4M"
                label="Ingresos del Mes"
                color="warning"
                trend="down"
                trendValue="-5%"
              />
              <StatsCard
                icon={<Activity size={22} />}
                value="87%"
                label="Eficiencia General"
                color="info"
                trend="neutral"
                trendValue="0%"
              />
            </div>
          </div>

          {/* Operational KPIs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              KPIs Operativos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={<Timer size={22} />}
                value="8,420 h"
                label="Horas Trabajadas"
                color="info"
                trend="up"
                trendValue="+8%"
              />
              <StatsCard
                icon={<Fuel size={22} />}
                value="12,450 L"
                label="Combustible Consumido"
                color="warning"
                trend="down"
                trendValue="-3%"
              />
              <StatsCard
                icon={<Wrench size={22} />}
                value="7"
                label="Mantenimientos Pendientes"
                color="error"
                trend="up"
                trendValue="+2"
              />
              <StatsCard
                icon={<HardHat size={22} />}
                value="14"
                label="Proyectos Activos"
                color="success"
                trend="neutral"
                trendValue="0"
              />
            </div>
          </div>

          {/* Financial KPIs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              KPIs Financieros
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={<CreditCard size={22} />}
                value="$845K"
                label="Cuentas por Cobrar"
                color="success"
                trend="up"
                trendValue="+4%"
              />
              <StatsCard
                icon={<Banknote size={22} />}
                value="$320K"
                label="Cuentas por Pagar"
                color="error"
                trend="down"
                trendValue="-12%"
              />
              <StatsCard
                icon={<TrendingUp size={22} />}
                value="32%"
                label="Margen Bruto"
                color="primary"
                trend="up"
                trendValue="+2%"
              />
              <StatsCard
                icon={<DollarSign size={22} />}
                value="$1.1M"
                label="Costos Operativos"
                color="neutral"
                trend="down"
                trendValue="-1%"
              />
            </div>
          </div>

          {/* Interactive KPIs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              KPIs Interactivos (Clickables)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={<AlertTriangle size={22} />}
                value="3"
                label="Incidentes Reportados"
                color="error"
                trend="down"
                trendValue="-1"
                onClick={() => console.log('Ver incidentes')}
              />
              <StatsCard
                icon={<Package size={22} />}
                value="28"
                label="Bajo Stock Inventario"
                color="warning"
                trend="up"
                trendValue="+5"
                onClick={() => console.log('Ver inventario')}
              />
              <StatsCard
                icon={<MapPin size={22} />}
                value="18"
                label="Unidades en Ruta"
                color="info"
                trend="up"
                trendValue="+2"
                onClick={() => console.log('Ver GPS')}
              />
              <StatsCard
                icon={<CheckCircle2 size={22} />}
                value="96%"
                label="Tareas Completadas"
                color="success"
                trend="up"
                trendValue="+3%"
                onClick={() => console.log('Ver tareas')}
              />
            </div>
          </div>

          {/* Without trend */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Sin Tendencia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={<Clock size={22} />}
                value="6.2 h"
                label="Horas Promedio por Turno"
                color="neutral"
              />
              <StatsCard
                icon={<Users size={22} />}
                value="42"
                label="Operadores Disponibles"
                color="primary"
              />
              <StatsCard
                icon={<Fuel size={22} />}
                value="18.5 L/h"
                label="Consumo Promedio"
                color="warning"
              />
              <StatsCard
                icon={<Wrench size={22} />}
                value="124"
                label="Servicios Realizados"
                color="info"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* ── SearchInput ──────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Buscador
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Buscar trabajadores..."
            />
            <SearchInput placeholder="Filtrar por numero de serie..." />
          </div>
        </Card>
      </section>

      {/* ── DataTable ────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Tabla de Datos
          </h2>

          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            10 Columnas + Colores de Header
          </h3>
          <p className="text-xs text-slate-400 -mt-3">
            Headers con colores por dominio. Scroll horizontal automatico. Contenido centrado con whitespace-nowrap.
          </p>
          <DataTable<WorkerRow>
            columns={workerColumns}
            data={sampleWorkers}
            keyExtractor={(w) => w.id}
            onRowClick={(w) => console.log("Clicked:", w.nombre)}
            maxBodyHeight="400px"
          />

          {/* SearchBar + Filters Example */}
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pt-4 border-t border-slate-100">
            Con Busqueda y Filtros
          </h3>
          <p className="text-xs text-slate-400 -mt-2">
            Barra de busqueda con filtros por columna. Los filtros se muestran como chips debajo de la busqueda.
          </p>

          <SearchBar
            value={tableSearch}
            placeholder="Buscar trabajador por nombre, puesto, RFC..."
            onChange={setTableSearch}
            filters={searchFilters}
            activeFilters={activeTableFilters}
            onRemoveFilter={(key) => setTableFilters((prev) => ({ ...prev, [key]: "" }))}
            onClearFilters={() => setTableFilters({})}
          />

          {/* Active Filters Chips */}
          <ActiveFilters
            filters={activeTableFilters}
            onRemove={(key) => setTableFilters((prev) => ({ ...prev, [key]: "" }))}
            onClearAll={() => setTableFilters({})}
          />

          {/* Filter Panel (toggleable) */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            <SlidersHorizontal size={14} />
            {showFilterPanel ? "Ocultar filtros" : "Mostrar panel de filtros"}
          </button>

          {showFilterPanel && (
            <FilterPanel
              filters={searchFilters}
              values={tableFilters}
              onChange={(key, value) => setTableFilters((prev) => ({ ...prev, [key]: value }))}
              onClear={() => setTableFilters({})}
            />
          )}

          <DataTable<WorkerRow>
            columns={workerColumns}
            data={filteredWorkers}
            keyExtractor={(w) => w.id}
            maxBodyHeight="400px"
            emptyText="No se encontraron trabajadores con esos criterios"
          />

          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pt-2">
            Sin Scroll (Tabla Reducida)
          </h3>
          <DataTable<WorkerRow>
            columns={workerColumns}
            data={sampleWorkers.slice(0, 3)}
            keyExtractor={(w) => w.id}
          />

          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pt-2">
            Estado Vacio
          </h3>
          <DataTable<WorkerRow>
            columns={workerColumns}
            data={[]}
            keyExtractor={() => ""}
            emptyText="No se encontraron trabajadores"
          />

          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pt-4 border-t border-slate-100 mt-4">
            Con Paginacion
          </h3>
          <p className="text-xs text-slate-400 -mt-2">
            Tabla con paginacion completa: avanzar, retroceder, saltar al inicio/fin.
          </p>
          <DataTable<WorkerRow>
            columns={workerColumns}
            data={sampleWorkers.slice(0, 4)}
            keyExtractor={(w) => w.id}
          />
          <Pagination
            currentPage={3}
            totalPages={10}
            totalRecords={98}
            pageSize={10}
            onPageChange={(page) => console.log("Page:", page)}
          />
        </Card>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Tabs
          </h2>

          <Tabs
            tabs={[
              { key: "general", label: "General", icon: <Settings size={16} /> },
              { key: "detalles", label: "Detalles", icon: <FileText size={16} /> },
              { key: "historial", label: "Historial", icon: <Clock size={16} />, count: 12 },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          >
            <TabPanel tabKey="general">
              <Card padding="md">
                <p className="text-sm text-slate-700">
                  Contenido de la pestana General. Aqui se muestra la informacion
                  principal del registro seleccionado.
                </p>
              </Card>
            </TabPanel>
            <TabPanel tabKey="detalles">
              <Card padding="md">
                <p className="text-sm text-slate-700">
                  Contenido de la pestana Detalles. Informacion extendida y campos
                  adicionales del registro.
                </p>
              </Card>
            </TabPanel>
            <TabPanel tabKey="historial">
              <Card padding="md">
                <p className="text-sm text-slate-700">
                  Contenido de la pestana Historial. Registro de movimientos y
                  cambios realizados a lo largo del tiempo.
                </p>
              </Card>
            </TabPanel>
          </Tabs>
        </Card>
      </section>

      {/* ── EmptyState ───────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Estados Vacios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState />

            <EmptyState
              icon={<AlertCircle size={36} />}
              title="Sin resultados"
              subtitle="No se encontraron registros que coincidan con los filtros aplicados."
              action={
                <Button variant="outline" icon={<Filter size={16} />}>
                  Limpiar Filtros
                </Button>
              }
            />
          </div>
        </Card>
      </section>

      {/* ── LoadingState ────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Estados de Carga
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              LoadingState - Centrado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card padding="md">
                <LoadingState size="sm" text="Cargando datos..." />
              </Card>
              <Card padding="md">
                <LoadingState size="md" text="Sincronizando informacion..." />
              </Card>
              <Card padding="md">
                <LoadingState size="lg" text="Preparando sistema..." />
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Skeleton - Placeholder de Contenido
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Texto (3 lineas)</p>
                <Skeleton variant="text" lines={3} />
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Titulo</p>
                <Skeleton variant="title" lines={2} />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avatar + Texto (Fila)</p>
              <Skeleton variant="row" />
              <Skeleton variant="row" />
              <Skeleton variant="row" />
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarjeta KPI</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton variant="card" />
                <Skeleton variant="card" />
                <Skeleton variant="card" />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SkeletonText - Texto Especializado</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Default (3 lineas)</p>
                  <SkeletonText lines={3} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Anchos aleatorios</p>
                  <SkeletonText lines={4} width="random" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Anchos personalizados</p>
                  <SkeletonText lines={3} width={['w-full', 'w-3/4', 'w-1/2']} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Titulo + ultima linea corta</p>
                  <SkeletonText lines={2} variant="title" lastLineWidth="w-1/3" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Modales ─────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Modales
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Modal Basico
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setBasicModalOpen(true)} variant="outline">
                Abrir Modal Basico
              </Button>
              <Button onClick={() => setConfirmModalOpen(true)} variant="danger">
                Modal de Confirmacion
              </Button>
              <Button onClick={() => setFormModalOpen(true)} icon={<Plus size={16} />}>
                Modal con Formulario
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Modal Basico ────────────────────────────────────────── */}
      <Modal open={basicModalOpen} onClose={() => setBasicModalOpen(false)} size="md">
        <ModalHeader title="Detalle del Trabajador" onClose={() => setBasicModalOpen(false)} />
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name="Carlos Hernandez" size="lg" />
              <div>
                <p className="text-sm font-bold text-slate-900">Carlos Hernandez</p>
                <p className="text-xs text-slate-500">Operador Maquinaria Pesada</p>
                <Badge variant="success" dot size="sm">Activo</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Telefono</p>
                <p className="text-slate-700">55 1234 5678</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">RFC</p>
                <p className="text-slate-700">HERC850101ABC</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Sueldo Fiscal</p>
                <p className="text-slate-700">$12,500.00</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Metodo de Pago</p>
                <p className="text-slate-700">Transferencia</p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setBasicModalOpen(false)}>
            Cerrar
          </Button>
          <Button icon={<Edit size={16} />}>
            Editar
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal de Confirmacion ────────────────────────────────── */}
      <Modal open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} size="sm">
        <ModalBody>
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Eliminar Registro</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Esta accion es permanente. Se eliminaran todos los datos asociados a este registro.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" icon={<Trash2 size={16} />}>
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal con Formulario ────────────────────────────────── */}
      <FormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="Nuevo Trabajador"
        subtitle="Completa los datos para registrar un nuevo trabajador"
        submitLabel="Guardar Trabajador"
        onSubmit={handleFormSubmit}
        isSubmitting={formSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModalField label="Nombre" required>
            <input
              type="text"
              placeholder="Nombre del trabajador"
              className={modalInputClass}
            />
          </ModalField>

          <ModalField label="Apellido Paterno" required>
            <input
              type="text"
              placeholder="Apellido paterno"
              className={modalInputClass}
            />
          </ModalField>

          <ModalField label="Apellido Materno">
            <input
              type="text"
              placeholder="Apellido materno (opcional)"
              className={modalInputClass}
            />
          </ModalField>

          <ModalField label="RFC">
            <input
              type="text"
              placeholder="RFC (13 caracteres)"
              className={modalInputClass}
              maxLength={13}
            />
          </ModalField>

          <ModalField label="Puesto" required>
            <div className="relative">
              <select className={modalSelectClass}>
                <option value="">Seleccionar puesto...</option>
                <option value="operador">Operador</option>
                <option value="mecanico">Mecanico</option>
                <option value="chofer">Chofer</option>
                <option value="oficinista">Oficinista</option>
              </select>
            </div>
          </ModalField>

          <ModalField label="Telefono">
            <input
              type="tel"
              placeholder="10 digitos"
              className={modalInputClass}
            />
          </ModalField>
        </div>

        <ModalField label="Direccion">
          <textarea
            placeholder="Direccion completa del trabajador..."
            className={modalTextareaClass}
            rows={3}
          />
        </ModalField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModalField label="Sueldo Fiscal" required hint="Monto mensual antes de deducciones">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                placeholder="0.00"
                className={modalInputClass + ' pl-8'}
              />
            </div>
          </ModalField>

          <ModalField label="Sueldo Efectivo" required hint="Monto que recibe el trabajador">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                placeholder="0.00"
                className={modalInputClass + ' pl-8'}
              />
            </div>
          </ModalField>
        </div>
      </FormModal>

      {/* ── Portal / Overlay ─────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Portal / Overlay
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Overlay con Portal
            </h3>
            <p className="text-xs text-slate-400">
              El overlay se renderiza fuera del DOM normal usando React Portal.
            </p>
            <Button
              variant="outline"
              onClick={() => setOverlayOpen(true)}
              icon={<Layers size={16} />}
            >
              Mostrar Overlay
            </Button>

            {overlayOpen && (
              <Portal>
                <Overlay onClick={() => setOverlayOpen(false)} blur>
                  <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      Overlay Portal
                    </h4>
                    <p className="text-sm text-slate-600 mb-4">
                      Este contenido esta renderizado en un portal fuera del arbol normal del DOM. Haz click fuera para cerrar.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setOverlayOpen(false)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </Overlay>
              </Portal>
            )}
          </div>
        </Card>
      </section>

      {/* ── Toasts ─────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Toasts - Notificaciones
          </h2>

          {/* Posiciones */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Posiciones
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as ToastPosition[]).map((pos) => (
                <Button
                  key={pos}
                  variant={toastPosition === pos ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setToastPosition(pos)}
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          {/* Transiciones */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Transiciones
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['fadeIn', 'bounceIn', 'swingInverted', 'popUp', 'topBounce', 'bounceInDown', 'bounceInUp'] as ToastTransition[]).map((t) => (
                <Button
                  key={t}
                  variant={toastTransition === t ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setToastTransition(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Botones de toast */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Tipos de Toast
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" onClick={() => fireToast('success')}>
                Success (Crear)
              </Button>
              <Button variant="warning" onClick={() => fireToast('warning')}>
                Warning (Editar)
              </Button>
              <Button variant="danger" onClick={() => fireToast('error')}>
                Error (Eliminar)
              </Button>
              <Button variant="info" onClick={() => fireToast('info')}>
                Info (Mostrar)
              </Button>
            </div>
          </div>

          {/* Todos los toasts de una vez */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Prueba Rapida
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success('Operacion completada', { position: toastPosition, transition: toastTransition });
                  setTimeout(() => toast.error('Algo fallo', { position: toastPosition, transition: toastTransition }), 200);
                  setTimeout(() => toast.warning('Revisa los campos', { position: toastPosition, transition: toastTransition }), 400);
                  setTimeout(() => toast.info('Datos sincronizados', { position: toastPosition, transition: toastTransition }), 600);
                }}
              >
                Lanzar los 4 tipos
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Layout y Spacing ────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Layout y Spacing - Sistema de Zona Segura
          </h2>

          {/* Safe Zone */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Zona Segura (Safe Zone)
            </h3>
            <div className="bg-slate-100 rounded-xl p-6 border-2 border-dashed border-slate-300">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-600">
                  <strong>Regla:</strong> Todas las paginas usan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">p-6</code> (24px) de padding. Las secciones se separan con <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">space-y-6</code> (24px). Las cards internas usan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">p-6</code> o <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">p-4</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Stack */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Stack - Espaciado Consistente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Vertical (gap-4)</p>
                <Stack gap="md">
                  <div className="h-10 bg-primary/10 rounded-lg flex items-center px-3 text-xs font-semibold text-primary">Item 1</div>
                  <div className="h-10 bg-primary/10 rounded-lg flex items-center px-3 text-xs font-semibold text-primary">Item 2</div>
                  <div className="h-10 bg-primary/10 rounded-lg flex items-center px-3 text-xs font-semibold text-primary">Item 3</div>
                </Stack>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Horizontal (gap-4)</p>
                <Stack direction="horizontal" gap="md">
                  <div className="h-10 bg-info/10 rounded-lg flex items-center px-3 text-xs font-semibold text-info">A</div>
                  <div className="h-10 bg-info/10 rounded-lg flex items-center px-3 text-xs font-semibold text-info">B</div>
                  <div className="h-10 bg-info/10 rounded-lg flex items-center px-3 text-xs font-semibold text-info">C</div>
                </Stack>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400">Gaps: xs (4px) | sm (8px) | md (16px) | lg (24px) | xl (32px)</p>
              <div className="flex flex-wrap gap-4">
                {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((g) => (
                  <div key={g} className="text-center">
                    <Stack gap={g}>
                      <div className="w-12 h-4 bg-primary rounded" />
                      <div className="w-12 h-4 bg-primary rounded" />
                      <div className="w-12 h-4 bg-primary rounded" />
                    </Stack>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{g}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Container */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Container - Max Widths
            </h3>
            <div className="space-y-2">
              {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((s) => (
                <div key={s} className="bg-slate-50 rounded-lg p-2">
                  <Container size={s} padding="none">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center text-xs font-semibold text-primary">
                      max-w-{s}
                    </div>
                  </Container>
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Grid - Layouts Responsivos
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Columnas fijas</p>
                <Grid columns={4} gap="md">
                  {['A', 'B', 'C', 'D'].map((item) => (
                    <div key={item} className="h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-semibold text-primary">
                      {item}
                    </div>
                  ))}
                </Grid>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Responsive: 1 col movil, 2 tablet, 4 desktop</p>
                <Grid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
                  {['1', '2', '3', '4'].map((item) => (
                    <div key={item} className="h-12 bg-success/10 rounded-lg flex items-center justify-center text-xs font-semibold text-success">
                      {item}
                    </div>
                  ))}
                </Grid>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Gaps: xs (8px) | sm (12px) | md (16px) | lg (24px) | xl (32px)</p>
                <div className="flex flex-wrap gap-4">
                  {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((g) => (
                    <div key={g} className="text-center">
                      <Grid columns={2} gap={g}>
                        <div className="w-12 h-8 bg-info/20 rounded" />
                        <div className="w-12 h-8 bg-info/20 rounded" />
                        <div className="w-12 h-8 bg-info/20 rounded" />
                        <div className="w-12 h-8 bg-info/20 rounded" />
                      </Grid>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{g}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Center - Centrado de Contenido
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Centrado total (vertical + horizontal)</p>
                <Center className="h-32 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                  <div className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Contenido centrado
                  </div>
                </Center>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">Vertical</p>
                  <Center axis="vertical" className="h-24 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                    <div className="bg-success/10 text-success px-3 py-1.5 rounded text-xs font-semibold">
                      Vertical
                    </div>
                  </Center>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">Horizontal</p>
                  <Center axis="horizontal" className="h-24 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                    <div className="bg-info/10 text-info px-3 py-1.5 rounded text-xs font-semibold">
                      Horizontal
                    </div>
                  </Center>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">Inline</p>
                  <p className="text-sm text-slate-600">
                    Texto con badge <Center inline as="span" axis="both"><span className="bg-warning/10 text-warning px-2 py-0.5 rounded text-xs font-semibold">inline</span></Center> centrado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Spacer - Espaciador Declarativo
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Vertical (entre elementos)</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-600">Contenido superior</p>
                  <Spacer size="lg" />
                  <p className="text-sm text-slate-600">Contenido inferior</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Horizontal (dentro de una fila)</p>
                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <span className="text-sm text-slate-600">Izquierda</span>
                  <Spacer axis="horizontal" size="lg" />
                  <span className="text-sm text-slate-600">Derecha</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Tamanos: xs (8px) | sm (12px) | md (16px) | lg (24px) | xl (32px) | 2xl (48px) | 3xl (64px)</p>
                <div className="flex items-end gap-6 bg-slate-50 rounded-xl border border-slate-200 p-4">
                  {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div className="w-8 bg-primary/20 rounded" style={{ height: s === 'xs' ? 8 : s === 'sm' ? 12 : s === 'md' ? 16 : s === 'lg' ? 24 : s === 'xl' ? 32 : s === '2xl' ? 48 : 64 }} />
                      <p className="text-[10px] font-bold text-slate-400">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Flex / Row / Column */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Flex, Row y Column - Layouts Flexbox
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Row - Fila con distribucion</p>
                <Row justify="between" align="center" className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <span className="text-sm font-semibold text-slate-700">Titulo</span>
                  <Button size="sm">Accion</Button>
                </Row>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Column - Columna apilada</p>
                <Column gap="sm" className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <span className="text-sm font-semibold text-slate-700">Paso 1</span>
                  <span className="text-sm text-slate-600">Descripcion del paso</span>
                  <Badge variant="success">Completado</Badge>
                </Column>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Flex generico (wrap + gap)</p>
                <Flex wrap="wrap" gap="sm" className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((item) => (
                    <div key={item} className="w-16 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-semibold text-primary">
                      {item}
                    </div>
                  ))}
                </Flex>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Alineaciones: start | center | end | between | evenly</p>
                <div className="space-y-2">
                  <Flex justify="start" gap="sm" className="bg-slate-50 rounded-lg border border-slate-200 p-2">
                    <div className="w-8 h-8 bg-info rounded" />
                    <div className="w-8 h-8 bg-info rounded" />
                  </Flex>
                  <Flex justify="center" gap="sm" className="bg-slate-50 rounded-lg border border-slate-200 p-2">
                    <div className="w-8 h-8 bg-success rounded" />
                    <div className="w-8 h-8 bg-success rounded" />
                  </Flex>
                  <Flex justify="end" gap="sm" className="bg-slate-50 rounded-lg border border-slate-200 p-2">
                    <div className="w-8 h-8 bg-warning rounded" />
                    <div className="w-8 h-8 bg-warning rounded" />
                  </Flex>
                  <Flex justify="between" className="bg-slate-50 rounded-lg border border-slate-200 p-2">
                    <div className="w-8 h-8 bg-error rounded" />
                    <div className="w-8 h-8 bg-error rounded" />
                  </Flex>
                </div>
              </div>
            </div>
          </div>

          {/* AspectRatio */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              AspectRatio - Proporciones Fijas
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Presets: video (16:9), square (1:1), photo (4:3), portrait (3:4)</p>
                <Grid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
                  <AspectRatio ratio="video" className="rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">16:9</span>
                  </AspectRatio>
                  <AspectRatio ratio="square" className="rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">1:1</span>
                  </AspectRatio>
                  <AspectRatio ratio="photo" className="rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">4:3</span>
                  </AspectRatio>
                  <AspectRatio ratio="portrait" className="rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">3:4</span>
                  </AspectRatio>
                </Grid>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Ratio numerico personalizado (2.39 = cinema)</p>
                <AspectRatio ratio={2.39} className="rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500">2.39:1</span>
                </AspectRatio>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Con contenido real (imagen/video placeholder)</p>
                <AspectRatio ratio="video" className="rounded-xl overflow-hidden bg-slate-900">
                  <div className="text-white text-center">
                    <div className="text-2xl font-black">▶</div>
                    <p className="text-xs mt-1">Video placeholder</p>
                  </div>
                </AspectRatio>
              </div>
            </div>
          </div>

          {/* VisuallyHidden */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              VisuallyHidden - Accesibilidad
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Texto oculto visualmente (disponible para lectores de pantalla)</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <button className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors">
                    <Search size={20} />
                    <VisuallyHidden>Buscar trabajadores</VisuallyHidden>
                  </button>
                  <p className="text-xs text-slate-500 mt-2">El boton muestra solo el icono, pero el texto "Buscar trabajadores" es leido por screen readers.</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Focusable (aparece al navegar con teclado)</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <a href="#main-content" className="inline-block">
                    <VisuallyHidden focusable>
                      Saltar al contenido principal
                    </VisuallyHidden>
                  </a>
                  <p className="text-xs text-slate-500 mt-2">Navega con Tab para ver el enlace "Saltar al contenido principal".</p>
                </div>
              </div>
            </div>
          </div>

          {/* Show / Hide */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Show / Hide - Por Breakpoint
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Show above md (oculto en movil, visible en desktop)</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <Show above="md">
                    <Badge variant="primary">Visible en md y superior</Badge>
                  </Show>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Hide above md (visible en movil, oculto en desktop)</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <Hide above="md">
                    <Badge variant="warning">Visible solo en movil</Badge>
                  </Hide>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Show below md (visible solo en movil y tablet)</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <Show below="md">
                    <Badge variant="info">Visible solo abajo de md</Badge>
                  </Show>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Combinado: texto adaptativo</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <Show above="md">
                    <span className="text-sm text-slate-700">Vista desktop: mas espacio para detalles</span>
                  </Show>
                  <Hide above="md">
                    <span className="text-sm text-slate-700">Vista movil: interfaz simplificada</span>
                  </Hide>
                </div>
              </div>
            </div>
          </div>

          {/* ScrollArea */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              ScrollArea - Scroll Personalizado
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Vertical con maxHeight</p>
                <ScrollArea maxHeight="160px" orientation="vertical" padding="sm" className="bg-slate-50 rounded-xl border border-slate-200">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <p key={i} className="text-sm text-slate-700 py-1.5 border-b border-slate-100 last:border-0">
                      Item {i + 1}: Contenido desplazable verticalmente
                    </p>
                  ))}
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Horizontal</p>
                <ScrollArea orientation="horizontal" padding="sm" className="bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex gap-3 min-w-max">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-24 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        Tag {i + 1}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Con scrollbar oculto</p>
                <ScrollArea maxHeight="120px" orientation="vertical" hideScrollbar padding="sm" className="bg-slate-50 rounded-xl border border-slate-200">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <p key={i} className="text-sm text-slate-700 py-1.5 border-b border-slate-100 last:border-0">
                      Item {i + 1}: Sin scrollbar visible
                    </p>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Separator - Separadores Horizontales y Verticales
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Horizontal (tamanos: thin, medium, thick)</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-sm text-slate-600">Contenido superior</p>
                  <Separator orientation="horizontal" size="thin" />
                  <p className="text-sm text-slate-600">Separador thin</p>
                  <Separator orientation="horizontal" size="medium" />
                  <p className="text-sm text-slate-600">Separador medium</p>
                  <Separator orientation="horizontal" size="thick" />
                  <p className="text-sm text-slate-600">Separador thick</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Vertical (dentro de una fila)</p>
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl border border-slate-200 p-4 h-16">
                  <span className="text-sm text-slate-600">Izquierda</span>
                  <Separator orientation="vertical" size="medium" />
                  <span className="text-sm text-slate-600">Centro</span>
                  <Separator orientation="vertical" size="medium" />
                  <span className="text-sm text-slate-600">Derecha</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Box - Contenedor Basico
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Variantes de fondo, borde y sombra</p>
                <Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
                  <BoxLayout padding="md" radius="lg" background="white" border="default" shadow="sm">
                    <p className="text-sm font-semibold text-slate-700">Card-like Box</p>
                    <p className="text-xs text-slate-500 mt-1">white + border + shadow-sm</p>
                  </BoxLayout>
                  <BoxLayout padding="md" radius="xl" background="slate" border="none">
                    <p className="text-sm font-semibold text-slate-700">Slate Box</p>
                    <p className="text-xs text-slate-500 mt-1">slate + radius-xl</p>
                  </BoxLayout>
                  <BoxLayout padding="md" radius="md" background="primary" border="primary">
                    <p className="text-sm font-semibold text-slate-700">Primary Tint Box</p>
                    <p className="text-xs text-slate-500 mt-1">primary/10 + border primary</p>
                  </BoxLayout>
                </Grid>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Full width y combinado</p>
                <BoxLayout padding="lg" radius="xl" background="white" border="default" shadow="md" fullWidth>
                  <p className="text-sm text-slate-700">Box de ancho completo con padding grande, sombra media y borde.</p>
                </BoxLayout>
              </div>
            </div>
          </div>

          {/* Collapse */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Collapse - Acordion Simple
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Controlado con boton</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <Button
                    variant="outline"
                    onClick={() => setCollapseOpen(!collapseOpen)}
                    icon={collapseOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  >
                    {collapseOpen ? 'Ocultar detalles' : 'Mostrar detalles'}
                  </Button>
                  <Collapse in={collapseOpen}>
                    <div className="pt-4 space-y-2">
                      <p className="text-sm text-slate-700">
                        Este contenido se expande y colapsa suavemente usando grid-rows-[0fr] y grid-rows-[1fr].
                      </p>
                      <p className="text-sm text-slate-600">
                        No requiere conocer la altura del contenido de antemano.
                      </p>
                    </div>
                  </Collapse>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Divider - Separadores
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Contenido antes del divisor</p>
              <Divider />
              <p className="text-sm text-slate-600">Contenido despues del divisor</p>
            </div>
            <div className="space-y-1">
              <Divider variant="dashed" />
              <p className="text-sm text-slate-600">Variante dashed</p>
            </div>
            <div className="space-y-1">
              <Divider variant="dotted" />
              <p className="text-sm text-slate-600">Variante dotted</p>
            </div>
            <Divider label="Seccion" />
            <p className="text-sm text-slate-600">Divider con label centrado</p>
          </div>

          {/* Sombras */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Sombras
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { shadow: 'shadow-none', label: 'Ninguna' },
                { shadow: 'shadow-sm', label: 'Small' },
                { shadow: 'shadow-md', label: 'Medium' },
                { shadow: 'shadow-lg', label: 'Large' },
                { shadow: 'shadow-xl', label: 'X-Large' },
                { shadow: 'shadow-primary', label: 'Primary' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-full h-16 bg-white rounded-xl ${item.shadow} border border-slate-100`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Border Radius
            </h3>
            <div className="flex flex-wrap items-end gap-4">
              {[
                { radius: 'rounded-sm', label: 'sm (6px)' },
                { radius: 'rounded-md', label: 'md (8px)' },
                { radius: 'rounded-lg', label: 'lg (12px)' },
                { radius: 'rounded-xl', label: 'xl (16px)' },
                { radius: 'rounded-2xl', label: '2xl (24px)' },
                { radius: 'rounded-full', label: 'full' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-16 bg-primary/10 border-2 border-primary/30 ${item.radius}`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Spacing Tokens */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Spacing Tokens (CSS Variables)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { token: '--spacing-page', value: '24px', desc: 'Padding de pagina' },
                { token: '--spacing-section', value: '24px', desc: 'Entre secciones' },
                { token: '--spacing-card', value: '24px', desc: 'Dentro de cards' },
                { token: '--spacing-card-sm', value: '16px', desc: 'Card padding sm' },
                { token: '--spacing-card-lg', value: '32px', desc: 'Card padding lg' },
                { token: '--spacing-inline', value: '12px', desc: 'Entre inline' },
                { token: '--spacing-stack', value: '16px', desc: 'Stack vertical' },
                { token: '--spacing-stack-sm', value: '8px', desc: 'Stack apretado' },
                { token: '--spacing-stack-lg', value: '24px', desc: 'Stack amplio' },
                { token: '--spacing-field', value: '16px', desc: 'Entre campos' },
                { token: '--spacing-field-gap', value: '6px', desc: 'Label a input' },
              ].map((item) => (
                <div key={item.token} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-[10px] font-mono font-bold text-primary">{item.token}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{item.value}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* ── GPS Tracking Components ──────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            GPS Tracking - Monitoreo en Tiempo Real
          </h2>

          <div className="space-y-4">
            {/* Live Indicator */}
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Indicador en Vivo
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <LiveIndicator />
              <StatusBadge status="moving" />
              <StatusBadge status="idle" />
              <StatusBadge status="offline" />
              <StatusBadge status="alert" />
            </div>

            {/* Map + Panel Layout */}
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Mapa de Seguimiento
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Map */}
              <div className="lg:col-span-2">
                <GpsMap
                  machines={mockMachines}
                  selectedId={selectedMachine?.id}
                  onSelect={setSelectedMachine}
                  height="350px"
                />
              </div>

              {/* Machine List */}
              <div>
                <MachineList
                  machines={mockMachines}
                  selectedId={selectedMachine?.id}
                  onSelect={setSelectedMachine}
                />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Charts ──────────────────────────────────────────────── */}
      <section>
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Graficas - Visualizacion de Datos
          </h2>

          <div className="space-y-6">
            {/* Bar Chart */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Grafica de Barras
              </h3>
              <BarChart
                title="Produccion Mensual"
                subtitle="Unidades producidas por mes"
                data={[
                  { label: 'Ene', value: 120 },
                  { label: 'Feb', value: 85 },
                  { label: 'Mar', value: 145 },
                  { label: 'Abr', value: 98 },
                  { label: 'May', value: 170 },
                  { label: 'Jun', value: 132 },
                ]}
                height={200}
                showLegend
              />
            </div>

            {/* Line + Area Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Grafica de Lineas
                </h3>
                <LineChart
                  title="Ingresos vs Egresos"
                  subtitle="Comparativa mensual"
                  labels={['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']}
                  series={[
                    { name: 'Ingresos', data: [45, 52, 38, 65, 58, 72] },
                    { name: 'Egresos', data: [30, 35, 28, 42, 38, 48] },
                  ]}
                  height={200}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Grafica de Area
                </h3>
                <AreaChart
                  title="Horas de Maquinaria"
                  subtitle="Uso diario por tipo"
                  labels={['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']}
                  series={[
                    { name: 'Excavadoras', data: [8, 6, 9, 7, 10, 4] },
                    { name: 'Bulldozers', data: [5, 7, 4, 8, 6, 3] },
                  ]}
                  height={200}
                />
              </div>
            </div>

            {/* Pie + Doughnut + Polar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Grafica Circular (Pie)
                </h3>
                <PieChart
                  title="Distribucion por Tipo"
                  data={[
                    { label: 'Excavadoras', value: 35 },
                    { label: 'Bulldozers', value: 25 },
                    { label: 'Camiones', value: 20 },
                    { label: 'Grúas', value: 12 },
                    { label: 'Otros', value: 8 },
                  ]}
                  height={200}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Grafica Dona (Doughnut)
                </h3>
                <DoughnutChart
                  title="Estado de Maquinaria"
                  data={[
                    { label: 'Activa', value: 42 },
                    { label: 'Mantenimiento', value: 8 },
                    { label: 'Inactiva', value: 5 },
                  ]}
                  height={200}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Radar (Radar)
                </h3>
                <RadarChartComponent
                  title="Habilidades del Equipo"
                  data={[
                    { label: 'Excavacion', value: 85 },
                    { label: 'Velocidad', value: 72 },
                    { label: 'Seguridad', value: 95 },
                    { label: 'Eficiencia', value: 68 },
                    { label: 'Mantenimiento', value: 78 },
                  ]}
                  height={200}
                />
              </div>
            </div>

            {/* Scatter + RadialBar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Grafica de Puntos (Scatter)
                </h3>
                <ScatterChartComponent
                  title="Velocidad vs Combustible"
                  subtitle="Relacion entre velocidad y consumo"
                  points={[
                    { x: 10, y: 25, label: 'M1' },
                    { x: 20, y: 45, label: 'M2' },
                    { x: 35, y: 60, label: 'M3' },
                    { x: 15, y: 30, label: 'M4' },
                    { x: 40, y: 75, label: 'M5' },
                    { x: 25, y: 50, label: 'M6' },
                    { x: 30, y: 55, label: 'M7' },
                    { x: 45, y: 80, label: 'M8' },
                  ]}
                  height={200}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Barras Radiales
                </h3>
                <RadialBarChartComponent
                  title="Metas del Trimestre"
                  data={[
                    { label: 'Produccion', value: 85 },
                    { label: 'Eficiencia', value: 72 },
                    { label: 'Seguridad', value: 95 },
                  ]}
                  height={200}
                />
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
