import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateVentaDto, VentaItemDto, VentaPagoDto } from './create-venta.dto';
import { CreateRetiroDto, CreateCierreDto } from './create-retiro-cierre.dto';

describe('CreateVentaDto', () => {
  it('should pass with a valid venta', async () => {
    const dto = plainToInstance(CreateVentaDto, {
      cajero: 'Carlos',
      items: [
        { materialId: 'c2000000-0000-0000-0000-000000000001', medida: 'm³', cantidad: 1, precioUnitario: 350 },
      ],
      pagos: [{ metodo: 'efectivo', monto: 350 }],
      metodo: 'efectivo',
      efectivoRecibido: 400,
      cambio: 50,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject when items is empty', async () => {
    const dto = plainToInstance(CreateVentaDto, {
      cajero: 'Carlos',
      items: [],
      pagos: [{ metodo: 'efectivo', monto: 10 }],
      metodo: 'efectivo',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.map((e) => e.property)).toContain('items');
  });

  it('should reject an invalid metodo', async () => {
    const dto = plainToInstance(CreateVentaDto, {
      cajero: 'Carlos',
      items: [{ materialId: 'c2000000-0000-0000-0000-000000000001', medida: 'm³', cantidad: 1, precioUnitario: 1 }],
      pagos: [{ metodo: 'efectivo', monto: 1 }],
      metodo: 'cheque',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('metodo');
  });

  it('should reject when cantidad is zero', async () => {
    const dto = plainToInstance(CreateVentaDto, {
      cajero: 'Carlos',
      items: [{ materialId: 'c2000000-0000-0000-0000-000000000001', medida: 'm³', cantidad: 0, precioUnitario: 350 }],
      pagos: [{ metodo: 'efectivo', monto: 0 }],
      metodo: 'efectivo',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('CreateRetiroDto / CreateCierreDto', () => {
  it('CreateRetiroDto requires concepto, monto and autorizadoPor', async () => {
    const valid = plainToInstance(CreateRetiroDto, {
      concepto: 'Gasolina',
      monto: 500,
      autorizadoPor: 'Jefe',
    });
    expect(await validate(valid)).toHaveLength(0);

    const invalid = plainToInstance(CreateRetiroDto, {
      concepto: 'Gasolina',
      monto: 0,
      autorizadoPor: 'Jefe',
    });
    const errors = await validate(invalid);
    expect(errors.map((e) => e.property)).toContain('monto');
  });

  it('CreateCierreDto accepts optional fields', async () => {
    const dto = plainToInstance(CreateCierreDto, {
      denominaciones: { '100': 1 },
      efectivoInicial: 500,
      fondoSiguiente: 200,
      notas: 'todo ok',
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});
