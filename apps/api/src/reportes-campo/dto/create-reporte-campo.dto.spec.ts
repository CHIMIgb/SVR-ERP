import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReporteCampoDto } from './create-reporte-campo.dto';
import { CambiarEstadoDto } from './cambiar-estado.dto';
import { ActividadDto } from './actividad.dto';
import { AdjuntoDto } from './adjunto.dto';
import { UpdateReporteCampoDto } from './update-reporte-campo.dto';

describe('CreateReporteCampoDto (flujo v2)', () => {
  const base = {
    categoria: 'DIESEL',
    usuario: 'Marcos G.',
    descripcion: 'Suministro de 200L de diésel. Tanque lleno.',
    prioridad: 'MEDIA',
  };

  it('pasa con datos válidos', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('el tipo viejo ya no se captura: se deriva del área en el service', () => {
    expect('tipo' in new CreateReporteCampoDto()).toBe(false);
  });

  it('categoria es opcional: la torre puede resolverse con "mismaArea" en el service', async () => {
    const { categoria: _c, ...sinCategoria } = base;
    const dto = plainToInstance(CreateReporteCampoDto, sinCategoria);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('acepta mismaArea como bandera booleana', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, { ...base, mismaArea: true });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('falla sin usuario', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, { ...base, usuario: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fecha y hora ya no se capturan (automáticas al registrar; el whitelist las rechaza)', () => {
    expect('fecha' in new CreateReporteCampoDto()).toBe(false);
    expect('hora' in new CreateReporteCampoDto()).toBe(false);
  });

  it('falla con prioridad inválida', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, { ...base, prioridad: 'URGENTE' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('pasa sin opcionales (prioridad, subcategoriaId, mismaArea)', async () => {
    const { prioridad: _p, ...sinOpcionales } = base;
    const dto = plainToInstance(CreateReporteCampoDto, sinOpcionales);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('pasa con subcategoría opcional (torre explícita)', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, {
      ...base,
      subcategoriaId: '550e8400-e29b-41d4-a716-446655440030',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('el DTO ya no contiene validación de facturación (fuera del flujo anterior)', async () => {
    // clienteId/proyectoId/montoServicio dejaron de validarse: si el payload
    // viejo llega al endpoint, el whitelist del ValidationPipe lo rechaza (400).
    expect('clienteId' in new CreateReporteCampoDto()).toBe(false);
    expect('montoServicio' in new CreateReporteCampoDto()).toBe(false);
  });
});

describe('CambiarEstadoDto (flujo v2)', () => {
  it('acepta EN_CURSO', async () => {
    const dto = plainToInstance(CambiarEstadoDto, { estado: 'EN_CURSO' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('acepta CERRADO', async () => {
    const dto = plainToInstance(CambiarEstadoDto, { estado: 'CERRADO' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza estados del flujo anterior y NUEVO', async () => {
    for (const estado of ['PENDIENTE', 'VISTO', 'ATENDIDO', 'EN_REVISION', 'RESUELTO', 'FACTURADO', 'NUEVO']) {
      const dto = plainToInstance(CambiarEstadoDto, { estado });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    }
  });
});

describe('UpdateReporteCampoDto (flujo v2)', () => {
  it('acepta cambio de categoria + GPS opcionales', async () => {
    const dto = plainToInstance(UpdateReporteCampoDto, {
      categoria: 'MANTENIMIENTO',
      latitud: 19.4,
      longitud: -99.13,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza categoria inválida', async () => {
    const dto = plainToInstance(UpdateReporteCampoDto, { categoria: 'COCINERO' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ActividadDto', () => {
  it('acepta texto válido', async () => {
    const dto = plainToInstance(ActividadDto, { texto: 'Revisada la bomba de agua' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza texto vacío', async () => {
    const dto = plainToInstance(ActividadDto, { texto: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('AdjuntoDto (sin tamano del cliente — review PR #17)', () => {
  const base = { nombre: 'evidencia.png', mime: 'image/png', datos: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAf' };

  it('acepta un PNG recortado válido (sin tamano del cliente)', async () => {
    const dto = plainToInstance(AdjuntoDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza mime no imagen', async () => {
    const dto = plainToInstance(AdjuntoDto, { ...base, mime: 'application/pdf' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza datos que no son base64', async () => {
    const dto = plainToInstance(AdjuntoDto, { ...base, datos: '%%no-base64%%' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza datos por arriba del tope de 2 MB de base64', async () => {
    // > 2,800,004 chars de base64 = más de 2 MB decodificados
    const dto = plainToInstance(AdjuntoDto, { ...base, datos: 'A'.repeat(2_800_050) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('ya NO existe la propiedad tamano en el contrato del DTO', () => {
    // El contrato ya no la conoce: un cliente no puede inflarla por esta vía.
    expect(Object.keys(AdjuntoDto.prototype)).not.toContain('tamano');
    expect(Object.keys(new AdjuntoDto() as unknown as Record<string, unknown>)).not.toContain('tamano');
  });
});
