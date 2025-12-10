import { Module } from '@nestjs/common';
import { PrepResourcesController } from './prep-resources.controller';
import { PrepResourcesService } from './prep-resources.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrepResourcesController],
  providers: [PrepResourcesService],
  exports: [PrepResourcesService],
})
export class PrepResourcesModule {}
