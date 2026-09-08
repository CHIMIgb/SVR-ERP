import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBancoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;
}