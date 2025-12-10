import { IsString, IsOptional, IsBoolean, IsInt, IsArray, IsDateString, Min } from 'class-validator';

export class CreateCollaborationDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @IsString()
  duration: string;

  @IsInt()
  @Min(1)
  durationMonths: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disciplines?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationAreas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collaborationType?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  degreeLevel?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyCommitment?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workLanguages?: string[];

  @IsOptional()
  @IsBoolean()
  hasFunding?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fundingTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  methodology?: string[];

  @IsOptional()
  @IsString()
  dataAvailability?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxMembers?: number;
}
