import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('BalancesController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await prismaService.cleanDatabase();
  });

  afterAll(async () => {
    await prismaService.cleanDatabase();
    await app.close();
  });

  it('should work', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/groups/123/balances');
    
    expect(response.status).toBe(404);
  });
});