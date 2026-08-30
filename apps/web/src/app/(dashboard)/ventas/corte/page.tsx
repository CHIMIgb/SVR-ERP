'use client';

import { useEffect, useState } from 'react';
import { Lock, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CorteCaja } from '@/components/pos/CorteCaja';
import { usePOS } from '@/components/pos/POSProvider';
import { useAuth } from '@/hooks/useAuth';
import { ventasApi, type TurnoConfig } from '@/lib/api';
import { parseHM, permiteCerrarCaja } from '@/lib/pos';

export default function CorteDelDiaPage() {
  const { user } = useAuth();
  const { sales, retiros } = usePOS();

  const cashierName = user?.persona && user.persona.nombre
    ? `${user.persona.nombre} ${user.persona.apellidoPaterno ?? ''}`.trim()
    : 'Cajero';

  const isAdmin = user?.roles.some((r) => r.nombre.toLowerCase().includes('admin')) ?? false;

  const puedeVer = user?.vistas.find((v) => v.ruta === '/ventas/corte')?.puedeVer ?? false;

  // Configuración de turno + validación de ventana de cierre
  const [turnoConfig, setTurnoConfig] = useState<TurnoConfig | null>(null);
  const [fueraDeVentana, setFueraDeVentana] = useState(false);

  useEffect(() => {
    ventasApi.config().then((res) => {
      if (res.success) {
        setTurnoConfig(res.data);
        // Verificar si se puede cerrar (según el tipo de turno: diurno/nocturno)
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        const { h: cH, m: cM } = parseHM(res.data.cierre);
        const { h: aH, m: aM } = parseHM(res.data.apertura);
        const fuera = !permiteCerrarCaja(nowMin, aH * 60 + aM, cH * 60 + cM);
        setFueraDeVentana(fuera);
      }
    });
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Corte del Día"
        subtitle={`Cierre de caja · Cajero: ${cashierName}`}
      />

      {!puedeVer ? (
        <EmptyState
          icon={<Lock className="w-10 h-10" />}
          title="Sin permiso para cerrar caja"
          subtitle="Tu rol no tiene acceso a /ventas/corte. Contacta a un administrador."
        />
      ) : (
        <>
          {/* Bloqueo por fuera de ventana de cierre */}
          {fueraDeVentana && turnoConfig && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-red-900 font-bold text-lg">Fuera de la ventana de cierre de caja</p>
                  <p className="text-red-700 text-sm font-medium mt-1">
                    El cierre solo está permitido después de las <strong>{turnoConfig.cierre}</strong> y hasta antes de las <strong>{turnoConfig.apertura}</strong> hrs (siguiente turno).
                    Hora actual: <strong>{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <CorteCaja sales={sales} cashierName={cashierName} retiros={retiros} isAdmin={isAdmin} />
        </>
      )}
    </div>
  );
}