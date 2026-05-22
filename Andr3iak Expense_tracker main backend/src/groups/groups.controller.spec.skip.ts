import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('GroupsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await prismaService.cleanDatabase();
  });

  afterAll(async () => {
    await prismaService.cleanDatabase();
    await app.close();
  });

  it('should create a new group', async () => {
    const createUserResponse = await request(app.getHttpServer())
      .post('/api/users/upsert')
      .send({ telegramId: 123456789, username: 'testuser' });

    const userId = createUserResponse.body.id;

    const response = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: 'Test Group', userId: userId });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Test Group');
  });
});
