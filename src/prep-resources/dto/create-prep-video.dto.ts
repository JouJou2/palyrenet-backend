import { IsString, IsOptional, IsNumber, IsArray, IsEnum, ValidateIf } from 'class-validator';

export class CreatePrepVideoDto {
  @ValidateIf(o => !o.titleAr)
  @IsString()
  title?: string;

  @ValidateIf(o => !o.title)
  @IsString()
  titleAr?: string;

  @ValidateIf(o => !o.instructorAr)
  @IsString()
  instructor?: string;

  @ValidateIf(o => !o.instructor)
  @IsString()
  instructorAr?: string;

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
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  embedUrl?: string;

  @IsOptional()
  @IsString()
  videoType?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsOptional()
  @IsNumber()
  durationMin?: number;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  captionsUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  access?: string[];

  @IsOptional()
  @IsEnum(['en', 'ar'])
  language?: string;
}
