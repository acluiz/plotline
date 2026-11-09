import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pages?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  genre?: string;
}
