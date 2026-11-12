"use client";

import React from 'react';
import { Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/layout/Toast';
import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { buttonClasses } from '@/components/ui/Button';
import { modalClasses } from '@/components/ui/Modal/Modal.styles';

export interface CredencialesAcceso {
  nombre: string;
  telefono: string;
  numeroEmpleado: string;
  pinTemporal: string;
  temporalHasta: string;
}

/**
 * P14 §6.6-2: entrega de credenciales por WhatsApp (wa.me con mensaje prellenado — sin API).
 * El PIN temporal se muestra UNA vez: vive en el estado de la vista; si se cierra sin enviar,
 * solo un "Reiniciar PIN" (P12) genera otro.
 */
export default function CredencialesAccesoModal({
  credenciales,
  onClose,
}: {
  credenciales: CredencialesAcceso;
  onClose: () => void;
}) {
  const { showToast } = useToast();

  // Enlace que recibe el trabajador (PR #18 #10): la dirección pública de la app
  // la da NEXT_PUBLIC_APP_URL — si RRHH entra por localhost, window.location.origin
  // no abriría en el teléfono. Sin la variable, cae al origen actual.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

  const mensaje = [
    `Hola ${credenciales.nombre}, ya tienes acceso a la app SVR:`,
    '',
    `Usuario: ${credenciales.numeroEmpleado}`,
    `PIN temporal: ${credenciales.pinTemporal} (vence en 24 h)`,
    '',
    'Entra aquí y crea tu propio PIN:',
    appUrl,
  ].join('\n');

  // wa.me pide el número en formato internacional: 10 dígitos mexicanos → antepone 52.
  const destino = credenciales.telefono.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${destino.length === 10 ? `52${destino}` : destino}?text=${encodeURIComponent(mensaje)}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      showToast('Mensaje copiado. Pégalo en WhatsApp u otro chat.', 'success');
    } catch {
      showToast('No se pudo copiar: escribe el mensaje a mano.', 'error');
    }
  };

  return (
    <Modal open onClose={onClose} size="md" persistent>
      <ModalHeader title="Credenciales de acceso" subtitle={credenciales.nombre} onClose={onClose} />
      <ModalBody className="space-y-4">
        <div role="alert" className="flex gap-2 px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Este PIN se muestra <strong>solo esta vez</strong>. Envíalo antes de cerrar; si se pierde o
            vence, usa el botón <strong>&ldquo;Reiniciar PIN&rdquo;</strong> en su fila de la lista de
            Trabajadores para generar otro.
          </p>
        </div>

        <div className="rounded-xl border border-ui-200 divide-y divide-ui-100">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-xs text-ui-500">Número de empleado</span>
            <span className={cn(modalClasses.title, 'text-sm')}>{credenciales.numeroEmpleado}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-xs text-ui-500">PIN temporal (24 h)</span>
            <span className="text-2xl font-black tracking-widest text-slate-900 dark:text-slate-50 font-mono">
              {credenciales.pinTemporal}
            </span>
          </div>
        </div>

        <p className="text-xs text-ui-500">
          El trabajador entra con su número + PIN y la app le pedirá crear su propio PIN.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={copiar} icon={<Check size={16} />}>
          Copiar mensaje
        </Button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonClasses.base, buttonClasses.variants.primary, buttonClasses.sizes.md)}
        >
          <MessageCircle size={16} />
          Enviar por WhatsApp
        </a>
      </ModalFooter>
    </Modal>
  );
}
