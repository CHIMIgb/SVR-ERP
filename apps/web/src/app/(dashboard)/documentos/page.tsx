"use client";

import React, { useState } from 'react';
import { 
  Plus, FileText, File, Image as ImageIcon, Download, 
  Search, MoreVertical, Users, HardHat, Truck, 
  Building2, Calculator, FileCheck, ShieldCheck
} from 'lucide-react';
import { documentos, type Documento } from '@/lib/data';

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIAS = ['Todos', 'Personal', 'Proyectos', 'Maquinaria', 'Proveedores', 'Contabilidad'] as const;

function getCategoriaIcon(cat: string) {
  switch (cat) {
    case 'Personal':      return <Users       className="w-4 h-4" />;
    case 'Proyectos':     return <HardHat     className="w-4 h-4" />;
    case 'Maquinaria':    return <Truck       className="w-4 h-4" />;
    case 'Proveedores':   return <Building2   className="w-4 h-4" />;
    case 'Contabilidad':  return <Calculator  className="w-4 h-4" />;
    default:              return <FileText    className="w-4 h-4" />;
  }
}

function getCategoriaColor(cat: string) {
  switch (cat) {
    case 'Personal':      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Proyectos':     return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'Maquinaria':    return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Proveedores':   return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Contabilidad':  return 'bg-green-50 text-green-700 border-green-200';
    default:              return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function getTipoIcon(tipo: Documento['tipo']) {
  switch (tipo) {
    case 'Contrato': return <FileText   className="w-6 h-6 text-blue-500" />;
    case 'ID':       return <ImageIcon  className="w-6 h-6 text-purple-500" />;
    case 'Factura':  return <File       className="w-6 h-6 text-green-500" />;
    case 'Manual':   return <FileCheck  className="w-6 h-6 text-orange-500" />;
    case 'Permiso':  return <ShieldCheck className="w-6 h-6 text-teal-500" />;
    case 'Póliza':   return <ShieldCheck className="w-6 h-6 text-red-400" />;
    default:         return <FileText   className="w-6 h-6 text-slate-400" />;
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DocumentosPage() {
  const [categoria, setCategoria] = useState<string>('Todos');
  const [search, setSearch] = useState('');

  const filtrados = documentos.filter(d => {
    const matchCat = categoria === 'Todos' || d.categoria === categoria;
    const matchSearch = d.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        d.propietario.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Documentación</h1>
          <p className="text-slate-500 font-medium">
            Repositorio central — contratos, IDs, facturas, manuales y más.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit border-none">
          <Plus className="w-5 h-5" />
          Subir Archivo
        </button>
      </div>

      {/* Resumen por categoría */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {CATEGORIAS.filter(c => c !== 'Todos').map(cat => {
          const count = documentos.filter(d => d.categoria === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`card py-4 px-4 flex flex-col items-start gap-2 transition-all hover:shadow-md border ${
                categoria === cat ? getCategoriaColor(cat) + ' shadow-md' : 'hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-lg border ${getCategoriaColor(cat)}`}>
                {getCategoriaIcon(cat)}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</p>
                <p className="text-xl font-black text-slate-900">{count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtros + Búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o propietario..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
          />
        </div>
        {/* Filtros de categoría */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                categoria === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {cat !== 'Todos' && getCategoriaIcon(cat)}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de documentos */}
      {filtrados.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold">No se encontraron documentos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtrados.map((doc) => (
            <div key={doc.id} className="card group hover:border-primary/30 transition-all p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/5 transition-colors">
                  {getTipoIcon(doc.tipo)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getCategoriaColor(doc.categoria)}`}>
                    {doc.categoria}
                  </span>
                  <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-1 truncate" title={doc.nombre}>
                {doc.nombre}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                {doc.tipo} • {doc.tamano}
              </p>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Propietario</p>
                  <p className="text-[11px] font-bold text-slate-700">{doc.propietario}</p>
                </div>
                <button className="p-2 bg-slate-900 text-white rounded-lg hover:bg-primary transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


