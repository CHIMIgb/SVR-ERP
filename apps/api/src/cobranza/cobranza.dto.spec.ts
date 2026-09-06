import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  METODOS_PAGO_COBRO,
  RegistrarCobroDto,
} from './dto/registrar-cobro.dto';
import { CrearCuentaDto } from './dto/crear-cuenta.dto';
import { ListarCuentasQuery } from './dto/listar-cuentas.query';

describe('Cobranza DTOs', () => {
  describe('RegistrarCobroDto', () => {
    it('acepta un cobro válido', async () => {
      const dto = new RegistrarCobroDto();
      dto.monto = 1500.5;
      dto.fecha = '2026-09-05';
      dto.metodoPago = 'TRANSFERENCIA';
      dto.referencia = 'REF-001';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rechaza monto <= 0', async () => {
      const dto = new RegistrarCobroDto();
      dto.monto = 0;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rechaza método de pago fuera del catálogo', async () => {
      expect(METODOS_PAGO_COBRO).toEqual(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE']);
      const dto = new RegistrarCobroDto();
      dto.monto = 100;
      dto.metodoPago = 'CRIPTO';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CrearCuentaDto', () => {
    it('acepta una cuenta válida', async () => {
      const dto = new CrearCuentaDto();
      dto.clienteId = '550e8400-e29b-41d4-a716-446655440010';
      dto.monto = 5000;
      dto.fechaVencimiento = '2026-11-01';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rechaza clienteId que no es UUID', async () => {
      const dto = new CrearCuentaDto();
      dto.clienteId = 'no-uuid';
      dto.monto = 100;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ListarCuentasQuery', () => {
    it('rechaza página inválida y acepta filtros válidos', async () => {
      const invalida = new ListarCuentasQuery();
      invalida.page = 0;
      const errors = await validate(invalida);
      expect(errors.length).toBeGreaterThan(0);

      const valida = new ListarCuentasQuery();
      valida.estado = 'PARCIAL';
      valida.situacion = 'ATRASO_GRAVE';
      valida.search = 'Constructora';
      valida.page = 2;
      valida.limit = 25;
      const errorsValida = await validate(valida);
      expect(errorsValida).toHaveLength(0);
    });

    it('rechaza estado fuera del catálogo', async () => {
      const dto = new ListarCuentasQuery();
      dto.estado = 'CANCELADA';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});