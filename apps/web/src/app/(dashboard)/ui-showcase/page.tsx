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
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from "@/components/ui/Modal";
import { useToast } from "@/components/layout/Toast";
import type { ToastPosition, ToastTransition } from "@/components/layout/Toast.types";

/* ────────────────────────────────────────────────────────────────
   Mock data
   ──────────────────────────────────────────────────────────────── */

const sampleOptions = [
  { value: "opt1", label: "Opcion 1" },
  { value: "opt2", label: "Opcion 2" },
  { value: "opt3", label: "Opcion 3" },
];

const sampleWorkers = [
  { id: "1", nombre: "Carlos Hernandez", puesto: "Operador", estado: "Activo" },
  { id: "2", nombre: "Maria Lopez", puesto: "Tecnico", estado: "Inactivo" },
  { id: "3", nombre: "Juan Perez", puesto: "Supervisor", estado: "Activo" },
  { id: "4", nombre: "Ana Garcia", puesto: "Mecanico", estado: "Permiso" },
];

interface WorkerRow {
  id: string;
  nombre: string;
  puesto: string;
  estado: string;
}

const workerColumns: Column<WorkerRow>[] = [
  { key: "nombre", header: "Nombre" },
  { key: "puesto", header: "Puesto" },
  {
    key: "estado",
    header: "Estado",
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
    render: () => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" icon={<Eye size={14} />}>
          Ver
        </Button>
        <Button variant="ghost" size="sm" icon={<Edit size={14} />}>
          Editar
        </Button>
      </div>
    ),
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
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
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
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
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
                { icon: <Info size={20} />, name: 'Info', uso: 'Info' },
                { icon: <AlertCircle size={20} />, name: 'AlertCircle', uso: 'Error critico' },
                { icon: <CheckCircle size={20} />, name: 'CheckCircle', uso: 'Completado' },
                { icon: <Info size={20} />, name: 'Info', uso: 'Informacion' },
                { icon: <Loader2 size={20} />, name: 'Loader2', uso: 'Spinner' },
                { icon: <Clock size={20} />, name: 'Clock', uso: 'Tiempo/Pendiente' },
                { icon: <RefreshCw size={20} />, name: 'RefreshCw', uso: 'Refrescar' },
                { icon: <RotateCcw size={20} />, name: 'RotateCcw', uso: 'Restaurar' },
                { icon: <Zap size={20} />, name: 'Zap',uso: 'Accion rapida' },
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
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
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
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
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
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
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Tarjetas de Estadisticas
          </h2>

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

          <DataTable<WorkerRow>
            columns={workerColumns}
            data={sampleWorkers}
            keyExtractor={(w) => w.id}
            onRowClick={(w) => console.log("Clicked:", w.nombre)}
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tabla (5 filas)</p>
              <Skeleton variant="table" lines={5} />
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
    </div>
  );
}
