import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  fullName: string;

  @IsString()
  institution: string;

  @IsEmail()
  email: string;

  @IsString()
  field: string;

  @IsString()
  coverMessage: string;

  @IsOptional()
  @IsString()
  attachment?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  motivation?: string;

  @IsOptional()
  @IsString()
  skills?: string;
}
