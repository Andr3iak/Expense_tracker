import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('summary')
  getSummary(@Query('days') days?: string) {
    return this.metricsService.getSummary(days ? parseInt(days) : 7);
  }

  @Get('endpoints')
  getTopEndpoints(@Query('days') days?: string) {
    return this.metricsService.getTopEndpoints(days ? parseInt(days) : 7);
  }

  @Get('daily')
  getDailyStats(@Query('days') days?: string) {
    return this.metricsService.getDailyStats(days ? parseInt(days) : 7);
  }

  @Get('slow')
  getSlowEndpoints(
    @Query('days') days?: string,
    @Query('threshold') threshold?: string,
  ) {
    return this.metricsService.getSlowEndpoints(
      days ? parseInt(days) : 7,
      threshold ? parseInt(threshold) : 500,
    );
  }
}
