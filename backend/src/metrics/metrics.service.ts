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
      // PostgreSQL: кавычки вокруг camelCase колонок, Date объект вместо строки
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "telegramId") as count
        FROM request_logs
        WHERE "createdAt" >= ${since}
          AND "telegramId" IS NOT NULL
      `,
      this.prisma.$queryRaw<[{ avg: number }]>`
        SELECT AVG("durationMs") as avg
        FROM request_logs
        WHERE "createdAt" >= ${since}
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
      Array<{ method: string; path: string; count: bigint; avgduration: number; errorcount: bigint }>
    >`
      SELECT
        method,
        path,
        COUNT(*) AS count,
        AVG("durationMs") AS avgduration,
        SUM(CASE WHEN "statusCode" >= 400 THEN 1 ELSE 0 END) AS errorcount
      FROM request_logs
      WHERE "createdAt" >= ${since}
      GROUP BY method, path
      ORDER BY count DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      method: r.method,
      path: r.path,
      count: Number(r.count),
      avgDurationMs: Math.round(Number(r.avgduration)),
      errorCount: Number(r.errorcount),
    }));
  }

  async getDailyStats(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // PostgreSQL: DATE_TRUNC или DATE() с явным приведением к DATE
    const rows = await this.prisma.$queryRaw<
      Array<{ date: Date; requests: bigint; uniqueusers: bigint; errors: bigint }>
    >`
      SELECT
        DATE("createdAt" AT TIME ZONE 'UTC') AS date,
        COUNT(*) AS requests,
        COUNT(DISTINCT "telegramId") AS uniqueusers,
        SUM(CASE WHEN "statusCode" >= 400 THEN 1 ELSE 0 END) AS errors
      FROM request_logs
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
      ORDER BY date ASC
    `;

    return rows.map((r) => ({
      // PostgreSQL возвращает Date объект, преобразуем в строку YYYY-MM-DD
      date: r.date instanceof Date
        ? r.date.toISOString().slice(0, 10)
        : String(r.date),
      requests: Number(r.requests),
      uniqueUsers: Number(r.uniqueusers),
      errors: Number(r.errors),
    }));
  }

  async getSlowEndpoints(days = 7, thresholdMs = 500) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<
      Array<{ method: string; path: string; avgduration: number; maxduration: number; count: bigint }>
    >`
      SELECT
        method,
        path,
        MAX("durationMs") AS maxduration,
        AVG("durationMs") AS avgduration,
        COUNT(*) AS count
      FROM request_logs
      WHERE "createdAt" >= ${since}
      GROUP BY method, path
      HAVING AVG("durationMs") > ${thresholdMs}
      ORDER BY avgduration DESC
      LIMIT 10
    `;

    return rows.map((r) => ({
      method: r.method,
      path: r.path,
      avgDurationMs: Math.round(Number(r.avgduration)),
      maxDurationMs: Number(r.maxduration),
      count: Number(r.count),
    }));
  }
}