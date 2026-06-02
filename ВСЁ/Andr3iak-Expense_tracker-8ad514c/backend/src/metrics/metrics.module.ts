import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MetricsService, MetricsInterceptor],
  controllers: [MetricsController],
  exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}
