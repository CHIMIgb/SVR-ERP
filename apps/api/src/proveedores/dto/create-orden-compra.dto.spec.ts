import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrdenCompraDto } from './create-orden-compra.dto';

describe('CreateOrdenCompraDto', () => {
  const base = {
    proveedorId: '3e4b04a7-5f2a-4c1e-9b7d-8a2f0e1c9d6b',
    descripcion: 'Compra de refacciones',
    items: [
      {
        nombre: 'Filtro de aceite x12',
        cantidad: 12,
        precioUnitario: 120,
      },
    ],
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass without descripcion (se deriva de las líneas)', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, descripcion: undefined, monto: 1440 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without proveedorId', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, proveedorId: undefined });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'proveedorId')).toBe(true);
  });

  it('should fail with monto 0', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, monto: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'monto')).toBe(true);
  });

  it('should fail with bad fecha', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, fecha: 'ayer' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'fecha')).toBe(true);
  });

  it('should fail without items', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, items: undefined });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'items')).toBe(true);
  });

  it('should fail with empty items array', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, items: [] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'items')).toBe(true);
  });

  it('should fail when item lacks nombre and articuloId (línea nueva sin nombre)', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [{ cantidad: 3, precioUnitario: 50 }],
    });
    const errors = await validate(dto);
    // items → [0] → nombre (anidación de @ValidateNested)
    const itemErrors = errors[0]?.children?.[0]?.children ?? [];
    expect(itemErrors.some((e) => e.property === 'nombre')).toBe(true);
  });

  it('should pass when item has articuloId without nombre (se trae del catálogo)', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [
        {
          articuloId: '3e4b04a7-5f2a-4c1e-9b7d-8a2f0e1c9d6b',
          cantidad: 3,
          precioUnitario: 50,
        },
      ],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with item cantidad 0', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [{ nombre: 'Cemento', cantidad: 0, precioUnitario: 100 }],
    });
    const errors = await validate(dto);
    const itemErrors = errors[0]?.children?.[0]?.children ?? [];
    expect(itemErrors.some((e) => e.property === 'cantidad')).toBe(true);
  });

  it('should fail with negative precioUnitario', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [{ nombre: 'Cemento', cantidad: 5, precioUnitario: -10 }],
    });
    const errors = await validate(dto);
    const itemErrors = errors[0]?.children?.[0]?.children ?? [];
    expect(itemErrors.some((e) => e.property === 'precioUnitario')).toBe(true);
  });
});