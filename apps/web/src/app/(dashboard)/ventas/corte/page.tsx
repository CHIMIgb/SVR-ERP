'use client';

import { Lock } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CorteCaja } from '@/components/pos/CorteCaja';
import { usePOS } from '@/components/pos/POSProvider';
import { useAuth } from '@/hooks/useAuth';

export default function CorteDelDiaPage() {
  const { user } = useAuth();
  const { sales, retiros } = usePOS();

  const cashierName = user?.persona && user.persona.nombre
    ? `${user.persona.nombre} ${user.persona.apellidoPaterno ?? ''}`.trim()
    : 'Cajero';

  const puedeVer = user?.vistas.find((v) => v.ruta === '/ventas/corte')?.puedeVer ?? false;

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
        <CorteCaja sales={sales} cashierName={cashierName} retiros={retiros} />
      )}
    </div>
  );
}