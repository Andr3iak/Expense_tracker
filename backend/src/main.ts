import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // BigInt не сериализуется в JSON из коробки — Telegram ID в Prisma хранится как BigInt.
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };

  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');

  // __dirname в prod указывает на backend/dist/, поэтому два уровня вверх до webapp/dist.
  const staticPath = join(__dirname, '..', '..', 'webapp', 'dist');
  app.useStaticAssets(staticPath);

  // SPA-fallback: все не-API маршруты отдают index.html, чтобы React Router работал.
  app.use((req: any, res: any, next: any) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(staticPath, 'index.html'));
    } else {
      next();
    }
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
