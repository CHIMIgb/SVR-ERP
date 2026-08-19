"use client";

import React from 'react';
import { X, Send, User, Calendar, Mail } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinatario?: string;
  asunto?: string;
  plantillaHtml?: string;
  fecha?: string;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  destinatario = "destinatario@svr.com",
  asunto = "Asunto del Correo",
  plantillaHtml = "<p>Contenido del correo...</p>",
  fecha = "Hace un momento"
}: EmailPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Email Box Panel */}
      <div className="relative bg-slate-100 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[fadeScaleIn_0.2s_ease-out] border border-slate-200">
        
        {/* Window Chrome Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-widest flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Servidor de Correos SVR (Enviado)
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Envelope Metadata Header */}
        <div className="bg-white px-8 py-5 border-b border-slate-200 space-y-2">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-black text-slate-800 leading-tight">
              {asunto}
            </h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3" /> {fecha}
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-500 font-semibold">
            <div className="flex gap-2">
              <span className="text-slate-400 w-12 text-right">De:</span>
              <span className="text-slate-800 flex items-center gap-1">
                <span className="font-bold text-primary">SVR Automático</span> &lt;sistema@svr-constructora.com&gt;
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-400 w-12 text-right">Para:</span>
              <span className="text-slate-800 font-bold">{destinatario}</span>
            </div>
          </div>
        </div>

        {/* Email HTML Body content */}
        <div className="p-8 bg-slate-50 overflow-y-auto max-h-[50vh] flex justify-center">
          <div 
            className="bg-white rounded-xl shadow-sm p-2 w-full max-w-[550px]"
            dangerouslySetInnerHTML={{ __html: plantillaHtml }} 
          />
        </div>

        {/* Bottom Actions */}
        <div className="bg-white border-t border-slate-200 px-8 py-4 flex justify-between items-center text-slate-400 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-green-600">
            <Send className="w-3.5 h-3.5" /> Estado: Entregado en bandeja de entrada
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>

      </div>
    </div>
  );
}
