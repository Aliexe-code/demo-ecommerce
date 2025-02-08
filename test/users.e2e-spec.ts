import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Server } from 'http';

interface User {
  id: number;
  name: string;
  email: string;
}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    server = app.getHttpServer() as unknown as Server;
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  // Clear the user table before each test to avoid unique constraint errors.
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a user', async () => {
      const userDto = { id: 1, name: 'sayed', email: 'sayed@example.com' };

      const res = await request(server)
        .post('/users')
        .send(userDto)
        .expect(201);

      const createdUser = res.body as User;
      expect(createdUser).toMatchObject({
        id: userDto.id,
        name: userDto.name,
        email: userDto.email,
      });
    });
  });

  describe('GET /users', () => {
    it('should return an array of users', async () => {
      const res = await request(server).get('/users').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a single user', async () => {
      const createdUser = await prisma.user.create({
        data: { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
      });

      const res = await request(server)
        .get(`/users/${createdUser.id}`)
        .expect(200);

      const user = res.body as User;
      expect(user).toMatchObject({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      });
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user', async () => {
      const createdUser = await prisma.user.create({
        data: { id: 3, name: 'Old Name', email: 'old@example.com' },
      });

      const updateDto = { name: 'New Name' };

      const res = await request(server)
        .patch(`/users/${createdUser.id}`)
        .send(updateDto)
        .expect(200);

      const updatedUser = res.body as User;
      expect(updatedUser.name).toBe('New Name');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const createdUser = await prisma.user.create({
        data: { id: 4, name: 'Delete user', email: 'delete@example.com' },
      });

      await request(server).delete(`/users/${createdUser.id}`).expect(200);

      await request(server).get(`/users/${createdUser.id}`).expect(404);
    });
  });
});
