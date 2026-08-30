import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class LiquidarTrabajadorDto {
  @IsIn(['Despido', 'Renuncia', 'Convenio'])
  tipoTerminacion!: 'Despido' | 'Renuncia' | 'Convenio';

  @IsNumber()
  @Min(0)
  diasTrabajadosPeriodo!: number;

  @IsNumber()
  @Min(0)
  diasVacacionesPendientes!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deduccionesPrestamos?: number;
}
