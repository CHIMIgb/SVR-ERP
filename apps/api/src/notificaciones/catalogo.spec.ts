import { TipoNotificacion } from '@prisma/client';
import { ALERTAS, construirAlerta, type DefinicionAlerta } from './catalogo';

describe('CATALOGO DE ALERTAS', () => {
  const entradas = Object.entries(ALERTAS) as [string, DefinicionAlerta<never>][];

  it('la tabla del encabezado y el objeto están sincronizados (12 alertas con claves únicas)', () => {
    expect(entradas).toHaveLength(12);
    expect(new Set(entradas.map(([clave]) => clave)).size).toBe(entradas.length);
    for (const [clave, def] of entradas) {
      expect(def.clave).toBe(clave); // la clave interna repite la llave
    }
  });

  it('toda definición tiene tipo válido del enum y referencia no vacía', () => {
    const tiposValidos = Object.values(TipoNotificacion);
    for (const [, def] of entradas) {
      expect(tiposValidos).toContain(def.tipo);
      expect(def.referenciaTipo.length).toBeGreaterThan(0);
      expect(typeof def.titulo).toBe('function');
      expect(typeof def.cuerpo).toBe('function');
    }
  });

  it('construirAlerta arma la entrada con referencia y actor (título sin recorte aquí — lo hace emitir)', () => {
    const entrada = construirAlerta(
      ALERTAS.REPORTE_NUEVO_TORRE,
      { codigo: 'INC0001', prioridadLabel: 'Alta', descripcion: 'x'.repeat(500) },
      'id-reporte',
      'user-actor',
    );
    expect(entrada).toEqual({
      tipo: TipoNotificacion.ALERTA,
      titulo: 'Nuevo reporte INC0001',
      cuerpo: `Alta — ${'x'.repeat(140)}`, // la definición trunca SU cuerpo
      referenciaTipo: 'reportes_campo',
      referenciaId: 'id-reporte',
      creadoPor: 'user-actor',
    });
  });

  it('los textos de reportes armados con su contexto real coinciden con el copy vivo', () => {
    const aceptado = construirAlerta(
      ALERTAS.REPORTE_ACEPTADO_AUTOR,
      { nombreAceptor: 'Carlos SVR', codigo: 'INC0066', descripcion: 'Cambio de refacción' },
      'id',
      'actor',
    );
    expect(aceptado.titulo).toBe('Carlos SVR aceptó tu reporte INC0066');
    expect(aceptado.cuerpo).toBe('Cambio de refacción');

    const actividad = construirAlerta(
      ALERTAS.REPORTE_ACTIVIDAD,
      { codigo: 'INC0066', nombreAutor: 'Pedro', texto: 'Ya compré la refacción' },
      'id',
      'actor',
    );
    expect(actividad.titulo).toBe('Nueva actividad en el reporte INC0066');
    expect(actividad.cuerpo).toBe('Pedro: "Ya compré la refacción"');

    const nomina = construirAlerta(
      ALERTAS.NOMINA_PAGADA,
      { periodo: 'S47-2026', periodoId: 'pid', count: 12 },
      'pid',
      'actor',
    );
    expect(nomina.titulo).toBe('Nómina pagada');
    expect(nomina.cuerpo).toBe('El periodo S47-2026 quedó PAGADO (12 nómina(s)).');

    const cierre = construirAlerta(
      ALERTAS.CIERRE_PENDIENTE,
      { cajero: 'Lupita', fecha: '2026-11-20', totalVentas: 1234.5, diferencia: -20 },
      'id',
      'actor',
    );
    expect(cierre.cuerpo).toContain('diferencia -$20.00');
  });

  it('el cuerpo del cierre y del abono formatean dinero es-MX/MXN', () => {
    const orden = construirAlerta(
      ALERTAS.OC_APROBADA,
      { folio: 'OC009', proveedor: 'Ferrulerías', monto: 1500 },
      'id',
      'actor',
    );
    expect(orden.cuerpo).toBe('Ferrulerías — $1,500.00 comprometidos en la orden de compra.');
  });
});
