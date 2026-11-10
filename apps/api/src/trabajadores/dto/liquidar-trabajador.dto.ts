import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class LiquidarTrabajadorDto {
  @IsIn(['Despido', 'Renuncia', 'Convenio'])
  tipoTerminacion!: 'Despido' | 'Renuncia' | 'Convenio';

  @IsNumber()
  @Min(0)
  @Max(31)
  diasTrabajadosPeriodo!: number;

  @IsNumber()
  @Min(0)
  @Max(365)
  diasVacacionesPendientes!: number;

  /** Tope de cordura (el finiquito no pasa de esto); si excede el total, el neto queda en 0. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99_999_999)
  deduccionesPrestamos?: number;
}
