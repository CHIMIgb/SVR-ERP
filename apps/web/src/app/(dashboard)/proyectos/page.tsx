"use client";

import React, { useState } from 'react';
import { Plus, Search, Filter, HardHat, CheckCircle2, AlertTriangle } from 'lucide-react';
import { proyectos as initialProyectos, Proyecto } from '@/lib/data';
import ProjectCard from '@/components/projects/ProjectCard';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import ProjectDetailsModal from '@/components/projects/ProjectDetailsModal';
import { useToast } from '@/components/layout/Toast';

export default function ProyectosPage() {
  const { showToast } = useToast();
  const [proyectos, setProyectos] = useState<Proyecto[]>(initialProyectos);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [form, setForm] = useState({ nombre: '', cliente: '', presupuesto: '', ubicacion: '', fechaFin: '' });

  const filtered = proyectos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.cliente.trim()) {
      showToast('Nombre y cliente son obligatorios.', 'error');
      return;
    }
    const ppto = parseFloat(form.presupuesto) || 0;
    const nuevo: Proyecto = {
      id: `P${Date.now()}`,
      nombre: form.nombre,
      cliente: form.cliente,
      estado: 'En Proceso',
      progreso: 0,
      presupuesto: ppto,
      gastado: 0,
      ubicacion: form.ubicacion || 'Por definir',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: form.fechaFin || 'Por definir',
      ingresoCobrado: ppto * 0.3, // 30% de anticipo
      gastoNomina: 0,
      gastoCombustible: 0,
      gastoMantenimiento: 0,
      gastoMateriales: 0,
      utilidadReal: ppto * 0.3,
      margenUtilidadPorcentaje: 30.0,
      historicoProgreso: [
        { fecha: "Ene", planificado: 10, real: 0 }
      ]
    };
    setProyectos((prev) => [nuevo, ...prev]);
    setForm({ nombre: '', cliente: '', presupuesto: '', ubicacion: '', fechaFin: '' });
    setModalOpen(false);
    showToast(`✅ Proyecto "${form.nombre}" creado correctamente.`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Gestión de Proyectos</h1>
          <p className="text-slate-500 font-medium">Control físico y financiero de obras activas.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit" onClick={() => setModalOpen(true)}>
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card border-l-4 border-l-primary py-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-50 text-primary rounded-xl flex items-center justify-center">
                <HardHat className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Proceso</p>
                <h4 className="text-xl font-black text-slate-900">{proyectos.filter(p => p.estado === 'En Proceso').length} Obras</h4>
             </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-green-500 py-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completados</p>
                <h4 className="text-xl font-black text-slate-900">{proyectos.filter(p => p.estado === 'Finalizado').length} Obras</h4>
             </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-secondary py-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-50 text-secondary rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrasos</p>
                <h4 className="text-xl font-black text-slate-900">0</h4>
             </div>
          </div>
        </div>
      </div>

      {/* Filters/Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o cliente..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
          />
        </div>
        <button onClick={() => showToast('Filtro por estado — próximamente', 'info')} className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
          <Filter className="w-4 h-4" />Estado
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-medium">No se encontraron proyectos.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProjectCard 
              key={p.id} 
              proyecto={p} 
              onManage={(proj) => setSelectedProject(proj)} 
            />
          ))}
        </div>
      )}

      {/* Modal Nuevo Proyecto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        title="Nuevo Proyecto"
        confirmLabel="Crear Proyecto"
      >
        <ModalField label="Nombre de la obra *">
          <input className={inputClass} placeholder="Fraccionamiento Valle Norte" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </ModalField>
        <ModalField label="Cliente *">
          <input className={inputClass} placeholder="Constructora ABC" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
        </ModalField>
        <ModalField label="Presupuesto (MXN)">
          <input type="number" className={inputClass} placeholder="1500000" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })} />
        </ModalField>
        <ModalField label="Ubicación">
          <input className={inputClass} placeholder="Toluca, Méx." value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
        </ModalField>
        <ModalField label="Fecha estimada de entrega">
          <input type="date" className={inputClass} value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
        </ModalField>
      </Modal>

      {selectedProject && (
        <ProjectDetailsModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          proyecto={selectedProject}
        />
      )}
    </div>
  );
}
