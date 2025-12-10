import { PartialType } from '@nestjs/mapped-types';
import { CreateLibraryResourceDto } from './create-library-resource.dto';

export class UpdateLibraryResourceDto extends PartialType(CreateLibraryResourceDto) {}
