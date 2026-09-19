import { IsString, MaxLength, MinLength } from 'class-validator';

export class RevertirCobroDto {
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  motivo!: string;
}