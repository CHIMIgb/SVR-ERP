import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EstadoOrdenCompra } from '@prisma/client';
import { CreateProveedorDto } from './create-proveedor.dto';
import { CreateOrdenCompraDto } from './create-orden-compra.dto';
import { RegistrarAbonoDto } from './registrar-abono.dto';
import { CambiarEstadoOrdenDto } from './cambiar-estado-orden.dto';
import { QueryOrdenesCompraDto } from './query-ordenes-compra.dto';

describe('CreateProveedorDto', () => {
  const base = { nombre: 'Ferretería El Tornillo' };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateProveedorDto, base);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('should fail without nombre', async () => {
    const dto = plainToInstance(CreateProveedorDto, {});
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail with invalid rfc', async () => {
    const dto = plainToInstance(CreateProveedorDto, { ...base, rfc: 'no-soy-rfc' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should pass with valid rfc persona moral', async () => {
    const dto = plainToInstance(CreateProveedorDto, { ...base, rfc: 'TOR890101ABC' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('should fail with categoria outside catalog', async () => {
    const dto = plainToInstance(CreateProveedorDto, { ...base, categoria: 'Flores' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail with invalid correo', async () => {
    const dto = plainToInstance(CreateProveedorDto, { ...base, correo: 'no-email' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});

describe('CreateOrdenCompraDto', () => {
  const base = {
    proveedorId: '550e8400-e29b-41d4-a716-446655440010',
    descripcion: 'Cemento 50kg',
    monto: 800,
  };

  it('should pass with valid data', async () => {
    expect(await validate(plainToInstance(CreateOrdenCompraDto, base))).toHaveLength(0);
  });

  it('should fail without proveedorId', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, proveedorId: undefined });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail with non-uuid proveedorId', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, proveedorId: 'no-uuid' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail with monto 0', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, monto: 0 });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail with invalid fecha', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, fecha: 'no-date' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});

describe('RegistrarAbonoDto', () => {
  const base = {
    ordenCompraId: '550e8400-e29b-41d4-a716-446655440010',
    monto: 400,
  };

  it('should pass with valid data', async () => {
    expect(await validate(plainToInstance(RegistrarAbonoDto, base))).toHaveLength(0);
  });

  it('should fail with monto 0 or negative', async () => {
    const dto = plainToInstance(RegistrarAbonoDto, { ...base, monto: -1 });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail with metodoPago outside catalog', async () => {
    const dto = plainToInstance(RegistrarAbonoDto, { ...base, metodoPago: 'BITCOIN' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});

describe('CambiarEstadoOrdenDto', () => {
  it('should pass with valid estado', async () => {
    const dto = plainToInstance(CambiarEstadoOrdenDto, { estado: EstadoOrdenCompra.APROBADA });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('should fail with invalid estado', async () => {
    const dto = plainToInstance(CambiarEstadoOrdenDto, { estado: 'FANTASMA' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail without estado', async () => {
    const dto = plainToInstance(CambiarEstadoOrdenDto, {});
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});

describe('QueryOrdenesCompraDto', () => {
  it('should pass with valid proveedorId and estado', async () => {
    const dto = plainToInstance(QueryOrdenesCompraDto, {
      proveedorId: '550e8400-e29b-41d4-a716-446655440010',
      estado: EstadoOrdenCompra.RECIBIDA,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('should fail with invalid estado', async () => {
    const dto = plainToInstance(QueryOrdenesCompraDto, { estado: 'OTRO' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('should fail with limit > 100', async () => {
    const dto = plainToInstance(QueryOrdenesCompraDto, { limit: 999 });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});