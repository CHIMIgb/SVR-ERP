"use client";

import { useState } from "react";
import {
  Plus, Save, Trash2, Edit, Search, Download, Filter,
  Users, Truck, HardHat, FileText, DollarSign, TrendingUp,
  AlertCircle, CheckCircle, Clock, Eye, Settings,
  LayoutDashboard, Mail, Phone, MapPin, Calendar,
  BarChart3, Activity, Loader2,
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
              Con Iconos
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button icon={<Plus size={16} />} iconPosition="left">
                Nuevo Registro
              </Button>
              <Button icon={<Save size={16} />} iconPosition="right">
                Guardar Cambios
              </Button>
              <Button variant="danger" icon={<Trash2 size={16} />}>
                Eliminar
              </Button>
              <Button variant="outline" icon={<Download size={16} />}>
                Descargar
              </Button>
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
    </div>
  );
}
