import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

 
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };

  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');

  
  const staticPath = join(__dirname, '..', '..', '..', 'webapp', 'dist');

 
  app.useStaticAssets(staticPath);

  
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api')) {
      return next(); 
    }
   
    res.sendFile(join(staticPath, 'index.html'));
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();