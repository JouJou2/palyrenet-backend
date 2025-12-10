import { PartialType } from '@nestjs/mapped-types';
import { CreatePrepVideoDto } from './create-prep-video.dto';

export class UpdatePrepVideoDto extends PartialType(CreatePrepVideoDto) {}
