import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MaxLength,
  IsInt,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  password!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  employeeNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  department?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  branch!: string;

  @IsNotEmpty()
  @IsInt()
  roleId!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
