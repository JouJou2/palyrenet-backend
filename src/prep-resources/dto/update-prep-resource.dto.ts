import { PartialType } from '@nestjs/mapped-types';
import { CreatePrepResourceDto } from './create-prep-resource.dto';

export class UpdatePrepResourceDto extends PartialType(CreatePrepResourceDto) {}
