import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, ValidateIf } from 'class-validator';

export class CreatePrepResourceDto {
  @ValidateIf(o => !o.titleAr)
  @IsString()
  title?: string;

  @ValidateIf(o => !o.title)
  @IsString()
  titleAr?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  typeAr?: string;

  @IsOptional()
  @IsEnum(['gre', 'toefl', 'ielts', 'sat', 'gmat'])
  examType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsEnum(['en', 'ar'])
  language?: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  access?: string[];

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  fileSizeMB?: string;

  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPreviewable?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresLogin?: boolean;
}
