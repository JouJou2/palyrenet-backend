import { IsString, IsOptional, IsArray, IsUrl, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CustomLinkDto {
  @IsString()
  name: string;

  @IsString()
  url: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  academicPosition?: string;

  @IsOptional()
  @IsString()
  highestDegree?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  orcid?: string;

  @IsOptional()
  @IsString()
  googleScholar?: string;

  @IsOptional()
  @IsString()
  researchGate?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldsOfStudy?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLanguages?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomLinkDto)
  customLinks?: CustomLinkDto[];
}
