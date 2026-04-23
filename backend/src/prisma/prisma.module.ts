import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() — PrismaService будет доступен в любом модуле без его явного импорта.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
