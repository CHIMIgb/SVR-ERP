import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrdenCompraDto } from '../src/proveedores/dto/create-orden-compra.dto';

const dto = plainToInstance(CreateOrdenCompraDto, {
  proveedorId: '550e8400-e29b-41d4-a716-446655440010',
  fecha: '2026-11-06',
  items: [{ nombre: 'Filtros de aceite', articuloId: 'no-es-uuid', cantidad: 2, precioUnitario: 350 }],
});
console.log('item transformado:', JSON.stringify((dto as any).items[0]));
validate(dto).then((errors) => {
  console.log('errores:', errors.length);
  for (const e of errors) {
    console.log('prop:', e.property, 'constraints:', JSON.stringify(e.constraints ?? {}));
    console.log('children:', e.children.map((c) => ({ prop: c.property, cons: c.constraints })));
  }
});
