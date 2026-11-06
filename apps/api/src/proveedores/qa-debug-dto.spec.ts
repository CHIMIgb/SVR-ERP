import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrdenCompraDto } from './dto/create-orden-compra.dto';

it('dbg: constraint real de articuloId malformado', async () => {
  const dto = plainToInstance(CreateOrdenCompraDto, {
    proveedorId: '550e8400-e29b-41d4-a716-446655440010',
    fecha: '2026-11-06',
    items: [{ nombre: 'Filtros de aceite', articuloId: 'no-es-uuid', cantidad: 2, precioUnitario: 350 }],
  });
  console.log('ITEM TRANSFORMADO:', JSON.stringify((dto as any).items[0]));
  const errors = await validate(dto);
  console.log('errores top:', errors.length);
  for (const e of errors) {
    console.log('prop:', e.property, '| cons:', JSON.stringify(e.constraints ?? {}));
    for (const c of e.children ?? []) {
      console.log('  child prop:', c.property, '| cons:', JSON.stringify(c.constraints ?? {}));
      for (const cc of c.children ?? []) {
        console.log('    grandchild:', cc.property, JSON.stringify(cc.constraints ?? {}));
      }
    }
  }
});
