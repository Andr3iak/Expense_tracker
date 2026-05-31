import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    const routePath: string = req.route?.path ?? req.path;
    const normalizedPath = routePath.replace(/^\/api/, '');
    const method: string = req.method;
    const telegramId = this.extractTelegramId(req);

    const log = (statusCode: number) => {
      const durationMs = Date.now() - start;
      this.metricsService.logRequest({
        method,
        path: normalizedPath,
        statusCode,
        durationMs,
        telegramId,
      }).catch(() => {});
    };

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        log(res.statusCode);
      }),
      catchError((err) => {
        const statusCode = err?.status ?? err?.statusCode ?? 500;
        log(statusCode);
        return throwError(() => err);
      }),
    );
  }

  private extractTelegramId(req: any): bigint | null {
    const header = req.headers?.['x-telegram-user-id'];
    if (header) {
      try { return BigInt(header); } catch { return null; }
    }
    const bodyId = req.body?.telegramId ?? req.body?.userId;
    if (bodyId) {
      try { return BigInt(bodyId); } catch { return null; }
    }
    return null;
  }
}
