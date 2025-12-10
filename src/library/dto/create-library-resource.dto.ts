import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, ValidateIf } from 'class-validator';

export class CreateLibraryResourceDto {
  @ValidateIf(o => !o.titleAr)
  @IsString()
  title?: string;

  @ValidateIf(o => !o.title)
  @IsString()
  titleAr?: string;

  @ValidateIf(o => !o.authorAr)
  @IsString()
  author?: string;

  @ValidateIf(o => !o.author)
  @IsString()
  authorAr?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  institutionAr?: string;

  @ValidateIf(o => !o.summaryAr)
  @IsString()
  summary?: string;

  @ValidateIf(o => !o.summary)
  @IsString()
  summaryAr?: string;

  @IsOptional()
  @IsEnum(['book', 'paper', 'summary', 'video'])
  type?: string;

  @IsOptional()
  @IsString()
  discipline?: string;

  @IsOptional()
  @IsString()
  disciplineAr?: string;

  @IsOptional()
  @IsEnum(['en', 'ar', 'other'])
  language?: string;

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
  fileSizeDisplay?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsBoolean()
  isPreviewable?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresLogin?: boolean;

  @IsOptional()
  @IsString()
  previewUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;
}
