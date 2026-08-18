"use client";

import React, { useState } from 'react';
import { Plus, Sun, Moon, Package, Clock, ArrowUpRight, Filter, Layers } from 'lucide-react';
import { registrosCriba, type RegistroCriba } from '@/lib/data';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TURNOS = ['Todos', 'Matutino', 'Vespertino'] as const;
const MATERIALES = ['Todos', ...Array.from(new Set(registrosCriba.map(r => r.tipoMaterial)))];

function getTurnoIcon(turno: RegistroCriba['turno']) {
  return turno === 'Matutino'
    ? <Sun  className="w-4 h-4 text-yellow-500" />
    : <Moon className="w-4 h-4 text-blue-400" />;
}

function getTurnoStyle(turno: RegistroCriba['turno']) {
  return turno === 'Matutino'
    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    : 'bg-blue-50 text-blue-700 border border-blue-200';
}

function getMaterialColor(tipo: string) {
  switch (tipo) {
    case 'Criba fina':   return 'bg-amber-500';
    case 'Criba gruesa': return 'bg-orange-500';
    case 'Arena lavada': return 'bg-teal-500';
    default:             return 'bg-slate-400';
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CribaPage() {
  const [turno, setTurno]       = useState<string>('Todos');
  const [material, setMaterial] = useState<string>('Todos');

  const filtrados = registrosCriba.filter(r => {
    const matchTurno    = turno    === 'Todos' || r.turno          === turno;
    const matchMaterial = material === 'Todos' || r.tipoMaterial   === material;
    return matchTurno && matchMaterial;
  });

  // KPIs globales
  const totalProducido  = registrosCriba.reduce((s, r) => s + r.materialProducido, 0);
  const totalAlBanco    = registrosCriba.reduce((s, r) => s + r.materialAlBanco,   0);
  const totalHoras      = registrosCriba.reduce((s, r) => s + r.horasTrabajadas,   0);
  const eficiencia      = totalProducido > 0 ? Math.round((totalAlBanco / totalProducido) * 100) : 0;

  // Resumen por material
  const resumenMaterial = Array.from(new Set(registrosCriba.map(r => r.tipoMaterial))).map(tipo => ({
    tipo,
    producido: registrosCriba.filter(r => r.tipoMaterial === tipo).reduce((s, r) => s + r.materialProducido, 0),
    alBanco:   registrosCriba.filter(r => r.tipoMaterial === tipo).reduce((s, r) => s + r.materialAlBanco, 0),
  }));

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Criba</h1>
          <p className="text-slate-500 font-medium">
            Producción diaria por turno — material producido y enviado al banco.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit border-none">
          <Plus className="w-5 h-5" />
          Registrar Turno
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card py-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total producido</p>
            <p className="text-2xl font-black text-slate-900">{totalProducido} <span className="text-sm font-bold text-slate-400">m³</span></p>
          </div>
        </div>

        <div className="card py-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Al banco</p>
            <p className="text-2xl font-black text-slate-900">{totalAlBanco} <span className="text-sm font-bold text-slate-400">m³</span></p>
          </div>
        </div>

        <div className="card py-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas trabajadas</p>
            <p className="text-2xl font-black text-slate-900">{totalHoras} <span className="text-sm font-bold text-slate-400">hrs</span></p>
          </div>
        </div>

        <div className="card py-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            eficiencia >= 90 ? 'bg-green-500/10 text-green-600' :
            eficiencia >= 70 ? 'bg-yellow-500/10 text-yellow-600' :
                               'bg-red-500/10 text-red-600'
          }`}>
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eficiencia</p>
            <p className={`text-2xl font-black ${
              eficiencia >= 90 ? 'text-green-600' :
              eficiencia >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>{eficiencia}<span className="text-sm font-bold text-slate-400">%</span></p>
          </div>
        </div>
      </div>

      {/* Resumen por tipo de material */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {resumenMaterial.map(m => {
          const ef = m.producido > 0 ? Math.round((m.alBanco / m.producido) * 100) : 0;
          return (
            <div key={m.tipo} className="card py-4 px-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${getMaterialColor(m.tipo)}`} />
                <p className="text-sm font-black text-slate-800">{m.tipo}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Producido</p>
                  <p className="text-lg font-black text-slate-900">{m.producido}</p>
                  <p className="text-[9px] text-slate-400 font-bold">m³</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Al banco</p>
                  <p className="text-lg font-black text-slate-900">{m.alBanco}</p>
                  <p className="text-[9px] text-slate-400 font-bold">m³</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efic.</p>
                  <p className={`text-lg font-black ${ef >= 90 ? 'text-green-600' : ef >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{ef}%</p>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getMaterialColor(m.tipo)}`}
                  style={{ width: `${ef}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Filtro turno */}
        <div className="flex gap-2">
          {TURNOS.map(t => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all whitespace-nowrap ${
                turno === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {t === 'Matutino' && <Sun  className="w-3.5 h-3.5 text-yellow-400" />}
              {t === 'Vespertino' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
              {t}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Filtro material */}
        <div className="flex gap-2 flex-wrap">
          {MATERIALES.map(m => (
            <button
              key={m}
              onClick={() => setMaterial(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all whitespace-nowrap ${
                material === m
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {m !== 'Todos' && <div className={`w-2 h-2 rounded-full ${getMaterialColor(m)}`} />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turno</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operador</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producido</th>
                <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Al banco</th>
                <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas</th>
                <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Efic.</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-bold text-sm">
                    Sin registros para los filtros seleccionados
                  </td>
                </tr>
              ) : filtrados.map(r => {
                const ef = r.materialProducido > 0
                  ? Math.round((r.materialAlBanco / r.materialProducido) * 100)
                  : 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{r.fecha}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getTurnoStyle(r.turno)}`}>
                        {getTurnoIcon(r.turno)}
                        {r.turno}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{r.operador}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${getMaterialColor(r.tipoMaterial)}`} />
                        <span className="font-bold text-slate-700">{r.tipoMaterial}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{r.materialProducido} <span className="text-slate-400 font-bold text-xs">m³</span></td>
                    <td className="px-6 py-4 text-right font-black text-green-700">{r.materialAlBanco} <span className="text-green-400 font-bold text-xs">m³</span></td>
                    <td className="px-6 py-4 text-right font-bold text-slate-600">{r.horasTrabajadas}h</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-black text-sm ${
                        ef >= 90 ? 'text-green-600' :
                        ef >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{ef}%</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs max-w-[180px] truncate">
                      {r.observaciones || <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
