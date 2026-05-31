import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_AGE_SECONDS = 86400; // 24 часа

function validateInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) return false;

  const authDate = Number(params.get('auth_date') ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return false;

  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  } catch {
    return false;
  }
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      // Dev-режим без токена: пропускаем, но помечаем запрос
      const req = context.switchToHttp().getRequest();
      req.telegramAuthSkipped = true;
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const initData = req.headers['x-telegram-init-data'] as string | undefined;

    if (!initData) {
      throw new UnauthorizedException('Missing x-telegram-init-data header');
    }

    if (!validateInitData(initData, botToken)) {
      throw new UnauthorizedException('Invalid Telegram initData signature');
    }

    // Добавляем распарсенный telegramId в запрос для использования в контроллерах
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (userJson) {
      try {
        req.telegramUser = JSON.parse(userJson);
      } catch {
        // ignore
      }
    }

    return true;
  }
}
