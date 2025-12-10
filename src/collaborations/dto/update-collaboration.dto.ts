import { PartialType } from '@nestjs/mapped-types';
import { CreateCollaborationDto } from './create-collaboration.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateCollaborationDto extends PartialType(CreateCollaborationDto) {
  @IsOptional()
  @IsEnum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
