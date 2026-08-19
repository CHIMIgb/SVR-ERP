"use client";

import React, { useState } from 'react';
import { 
  Phone, Clock, Briefcase, FileText, ChevronDown, Download, 
  File, Image as ImageIcon, FileCheck, ShieldCheck, X, Truck,
  CheckCircle2, Award, ClipboardList
} from 'lucide-react';
import { Trabajador, documentos, bitacorasRentaData, type Documento } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';

interface WorkerCardProps {
  trabajador: Trabajador;
  onOpenBitacoras?: (t: Trabajador) => void;
}

function getTipoIcon(tipo: Documento['tipo']) {
  switch (tipo) {
    case 'Contrato': return <FileText  className="w-4 h-4 text-blue-500" />;
    case 'ID':       return <ImageIcon className="w-4 h-4 text-purple-500" />;
    case 'Factura':  return <File      className="w-4 h-4 text-green-500" />;
    case 'Manual':   return <FileCheck className="w-4 h-4 text-orange-500" />;
    case 'Permiso':  return <ShieldCheck className="w-4 h-4 text-teal-500" />;
    case 'Póliza':   return <ShieldCheck className="w-4 h-4 text-red-400" />;
    default:         return <FileText  className="w-4 h-4 text-slate-400" />;
  }
}

export default function WorkerCard({ trabajador, onOpenBitacoras }: WorkerCardProps) {
  const { showToast } = useToast();
  const [docsOpen, setDocsOpen] = useState(false);

  const statusColors = {
    Activo: "bg-green-500",
    Inactivo: "bg-slate-400",
    Vacaciones: "bg-blue-400",
  };

  const categoryColors = {
    Operador: "bg-orange-50 text-orange-700 border-orange-200",
    Chofer: "bg-blue-50 text-blue-700 border-blue-200",
    Mecanico: "bg-purple-50 text-purple-700 border-purple-200",
    Ingeniero: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Administrativo: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const workerDocs = documentos.filter(d => d.trabajadorId === trabajador.id);
  const workerBitacoras = bitacorasRentaData.filter(b => b.trabajadorId === trabajador.id);

  return (
    <div className="card group p-5 space-y-4 hover:shadow-lg transition-all border border-slate-200">
      
      {/* Top Identity Bar */}
      <div className="flex items-start gap-3.5">
        <div className="w-13 h-13 bg-secondary rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform shrink-0">
          {trabajador.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-black text-slate-900 text-base leading-tight truncate">{trabajador.nombre}</h3>
            <span className={`text-[9px] font-black uppercase tracking-widest ${statusColors[trabajador.estado as keyof typeof statusColors] ?? 'bg-slate-400'} text-white px-2 py-0.5 rounded shadow-sm shrink-0`}>
              {trabajador.estado}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${categoryColors[trabajador.categoriaPuesto] ?? 'bg-slate-100'}`}>
              {trabajador.categoriaPuesto}
            </span>
            <span className="text-xs font-bold text-primary truncate">{trabajador.puesto}</span>
          </div>
        </div>
      </div>

      {/* Renta / Asignación Status Banner */}
      {trabajador.estadoRenta === 'Rentado a Cliente' && trabajador.clienteRentaActual && (
        <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-orange-700 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-orange-600" /> Rentado a Cliente
            </span>
            <span className="text-[9px] font-bold text-orange-800">{trabajador.maquinaAsignadaId}</span>
          </div>
          <p className="font-black text-slate-900 text-[11px] truncate">
            {trabajador.clienteRentaActual}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            Equipo: {trabajador.maquinaAsignadaNombre}
          </p>
        </div>
      )}

      {/* Certification / License Badge */}
      {trabajador.licenciaODC3 && (
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium flex items-center gap-1 truncate">
            <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <strong className="text-slate-800">{trabajador.licenciaODC3.tipo}</strong>
          </span>
          <span className="text-slate-400 font-mono shrink-0 ml-1">Vig: {trabajador.licenciaODC3.vigencia}</span>
        </div>
      )}

      {/* Operational details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Contacto:
          </span>
          <span className="font-bold text-slate-800">{trabajador.telefono}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> Obras:
          </span>
          <div className="flex gap-1 flex-wrap justify-end">
            {trabajador.proyectos.map(p => (
              <span key={p} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Actions */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        
        {/* Botón Hojas de Bitácora / Renta */}
        {(trabajador.categoriaPuesto === 'Operador' || trabajador.categoriaPuesto === 'Chofer') && (
          <button
            onClick={() => onOpenBitacoras?.(trabajador)}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all shadow-sm group/btn"
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-orange-400" /> Hojas de Bitácora / Renta
            </span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">
              {workerBitacoras.length} hojas
            </span>
          </button>
        )}

        {/* Botón Ver Documentos */}
        <button
          onClick={() => setDocsOpen(prev => !prev)}
          className={`flex items-center justify-between w-full py-2 px-3 rounded-xl transition-all ${
            docsOpen
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {docsOpen ? 'Ocultar documentos' : 'Ver documentos personales'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              docsOpen ? 'bg-white/20' : 'bg-blue-100'
            }`}>
              {workerDocs.length}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${docsOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Panel de documentos expandible */}
        {docsOpen && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
            {workerDocs.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-[11px] font-bold text-slate-400">Sin documentos registrados</p>
              </div>
            ) : (
              <div className="divide-y divide-blue-100">
                {workerDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-100/50 transition-colors">
                    <div className="p-1 bg-white rounded-lg shadow-sm shrink-0">
                      {getTipoIcon(doc.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{doc.nombre}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {doc.tipo} • {doc.tamano}
                      </p>
                    </div>
                    <button
                      onClick={() => showToast(`⬇️ Descargando ${doc.nombre}...`, 'success')}
                      className="p-1.5 bg-white rounded-lg text-slate-500 hover:text-primary hover:shadow-md transition-all shrink-0"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
