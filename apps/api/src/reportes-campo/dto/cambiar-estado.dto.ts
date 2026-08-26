import { IsEnum } from 'class-validator';
import { EstadoReporteCampo } from '@prisma/client';

export class CambiarEstadoDto {
  @IsEnum(EstadoReporteCampo)
  estado!: EstadoReporteCampo;
}
