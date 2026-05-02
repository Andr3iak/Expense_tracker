import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface LogRequestDto {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  telegramId: bigint | null;
}

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async logRequest(dto: LogRequestDto): Promise<void> {
    await this.prisma.requestLog.create({
      data: {
        method: dto.method,
        path: dto.path,
        statusCode: dto.statusCode,
        durationMs: dto.durationMs,
        telegramId: dto.telegramId,
      },
    });
  }

  async getSummary(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, errors, uniqueUsers, avgDuration] = await Promise.all([
      this.prisma.requestLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.requestLog.count({
        where: { createdAt: { gte: since }, statusCode: { gte: 400 } },
      }),
      this.prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(DISTINCT telegramId) as count
        FROM request_logs
        WHERE createdAt >= ${since.toISOString()}
          AND telegramId IS NOT NULL
      `,
      this.prisma.$queryRaw<[{ avg: number }]>`
        SELECT AVG(durationMs) as avg
        FROM request_logs
        WHERE createdAt >= ${since.toISOString()}
      `,
    ]);

    return {
      period: `last ${days} days`,
      totalRequests: total,
      errorRequests: errors,
      errorRate: total > 0 ? ((errors / total) * 100).toFixed(1) + '%' : '0%',
      uniqueUsers: Number(uniqueUsers[0]?.count ?? 0),
      avgResponseMs: Math.round(Number(avgDuration[0]?.avg ?? 0)),
    };
  }

  async getTopEndpoints(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<
      Array<{ method: string; path: string; count: number; avgDuration: number; errorCount: number }>
    >`
      SELECT
        method,
        path,
        COUNT(*) as count,
        AVG(durationMs) as avgDuration,
        SUM(CASE WHEN statusCode >= 400 THEN 1 ELSE 0 END) as errorCount
      FROM request_logs
      WHERE createdAt >= ${since.toISOString()}
      GROUP BY method, path
      ORDER BY count DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      method: r.method,
      path: r.path,
      count: Number(r.count),
      avgDurationMs: Math.round(Number(r.avgDuration)),
      errorCount: Number(r.errorCount),
    }));
  }

  async getDailyStats(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<
      Array<{ date: string; requests: number; uniqueUsers: number; errors: number }>
    >`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as requests,
        COUNT(DISTINCT telegramId) as uniqueUsers,
        SUM(CASE WHEN statusCode >= 400 THEN 1 ELSE 0 END) as errors
      FROM request_logs
      WHERE createdAt >= ${since.toISOString()}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    return rows.map((r) => ({
      date: r.date,
      requests: Number(r.requests),
      uniqueUsers: Number(r.uniqueUsers),
      errors: Number(r.errors),
    }));
  }

  async getSlowEndpoints(days = 7, thresholdMs = 500) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<
      Array<{ method: string; path: string; p95: number; maxDuration: number; count: number }>
    >`
      SELECT
        method,
        path,
        MAX(durationMs) as maxDuration,
        AVG(durationMs) as p95,
        COUNT(*) as count
      FROM request_logs
      WHERE createdAt >= ${since.toISOString()}
      GROUP BY method, path
      HAVING AVG(durationMs) > ${thresholdMs}
      ORDER BY p95 DESC
      LIMIT 10
    `;

    return rows.map((r) => ({
      method: r.method,
      path: r.path,
      avgDurationMs: Math.round(Number(r.p95)),
      maxDurationMs: Number(r.maxDuration),
      count: Number(r.count),
    }));
  }
}
