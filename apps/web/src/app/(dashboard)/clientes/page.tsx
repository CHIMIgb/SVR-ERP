"use client";

import React from 'react';
import { Plus, Building2, Mail, Phone, ExternalLink, Search, Filter } from 'lucide-react';
import { clientes } from '@/lib/data';

export default function ClientesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Directorio de Clientes</h1>
          <p className="text-slate-500 font-medium">Gestión de contactos comerciales y empresas contratantes.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((c) => (
          <div key={c.id} className="card group">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                   {c.empresa[0]}
                </div>
                <div>
                   <h3 className="font-black text-slate-900 leading-tight">{c.empresa}</h3>
                   <p className="text-xs font-bold text-primary">{c.nombre}</p>
                </div>
             </div>

             <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                   <Mail className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium">{c.correo}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                   <Phone className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium">{c.telefono}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                   <Building2 className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium">{c.obrasActivas} Obras activas</span>
                </div>
             </div>

             <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                   Historial
                   <ExternalLink className="w-3 h-3" />
                </button>
                <button className="flex-1 py-2 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-slate-900 transition-all">
                   Nueva Cotización
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
