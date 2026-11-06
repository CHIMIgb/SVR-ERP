import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrdenCompraDto, OrdenCompraItemInput } from './create-orden-compra.dto';

describe('CreateOrdenCompraDto — items', () => {
  const base = {
    proveedorId: '550e8400-e29b-41d4-a716-446655440010',
    fecha: '2026-11-06',
  };

  const item = (overrides: Partial<{ articuloId: string; nombre: string; cantidad: number; precioUnitario: number }> = {}) => ({
    nombre: 'Filtros de aceite',
    cantidad: 2,
    precioUnitario: 350,
    ...overrides,
  });

  it('acepta articuloId heredado del dump (v0/variante 0) — hex-36', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [item({ articuloId: 'c2000000-0000-0000-0000-000000000001' })],
    });
    const errors = await validate(dto);
    const articuloErrors = errors.find((e) => e.property === 'items');
    expect(articuloErrors).toBeUndefined();
  });

  it('rechaza articuloId malformado (no hex-36) — constraint en grandchild', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [item({ articuloId: 'no-es-uuid' })],
    });
    const errors = await validate(dto);
    const itemsError = errors.find((e) => e.property === 'items');
    expect(itemsError).toBeTruthy();
    // El constraint vive a nivel grandchild: items → 0 → articuloId
    const str = JSON.stringify(itemsError?.children);
    expect(str).toContain('articuloId debe ser un UUID');
  });

  it('rechaza línea vacía sin producto ni articuloId', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [item({ articuloId: undefined, nombre: '' })],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});