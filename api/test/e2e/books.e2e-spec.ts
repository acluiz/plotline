import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import { BookOrmEntity } from '../../src/infrastructure/entities/book.orm-entity';
import { prepareTestDatabase } from '../support/test-database';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface BookResponse {
  id: string;
  title: string;
  author: string;
  pages: number | null;
  genre: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
}

describe('Books (e2e)', () => {
  let app: INestApplication<App>;
  let bookRepository: Repository<BookOrmEntity>;

  beforeAll(async () => {
    const setup = await prepareTestDatabase();
    await setup.destroy();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    bookRepository = app.get(DataSource).getRepository(BookOrmEntity);
  });

  beforeEach(async () => {
    await bookRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/books', () => {
    it('creates a book with all fields and returns 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          pages: 432,
          genre: 'Technology',
        })
        .expect(201);

      const body = response.body as BookResponse;
      expect(body.id).toMatch(UUID_REGEX);
      expect(body).toMatchObject({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
        status: 'WANT_TO_READ',
      });
      expect(Number.isNaN(Date.parse(body.createdAt))).toBe(false);
      expect(Number.isNaN(Date.parse(body.updatedAt))).toBe(false);
      expect(Object.keys(body).sort()).toEqual([
        'author',
        'createdAt',
        'genre',
        'id',
        'pages',
        'status',
        'title',
        'updatedAt',
      ]);
    });

    it('persists the created book in the database', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({ title: 'Clean Architecture', author: 'Robert C. Martin' })
        .expect(201);

      const { id } = response.body as BookResponse;
      const row = await bookRepository.findOneByOrFail({ id });
      expect(row.title).toBe('Clean Architecture');
      expect(row.status).toBe('WANT_TO_READ');
    });

    it('creates a book with only the required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({ title: 'Dune', author: 'Frank Herbert' })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Dune',
        author: 'Frank Herbert',
        pages: null,
        genre: null,
        status: 'WANT_TO_READ',
      });
    });

    it('generates a distinct id for each book', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({ title: 'A', author: 'B' })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({ title: 'A', author: 'B' })
        .expect(201);

      expect((first.body as BookResponse).id).not.toBe(
        (second.body as BookResponse).id,
      );
      expect(await bookRepository.count()).toBe(2);
    });

    describe('validation errors', () => {
      const valid = { title: 'Dune', author: 'Frank Herbert' };

      it.each([
        ['title is missing', { author: 'Frank Herbert' }],
        ['author is missing', { title: 'Dune' }],
        ['body is empty', {}],
        ['title is empty', { ...valid, title: '' }],
        ['title is blank', { ...valid, title: '   ' }],
        ['author is empty', { ...valid, author: '' }],
        ['author is blank', { ...valid, author: '   ' }],
        ['title is not a string', { ...valid, title: 123 }],
        ['pages is zero', { ...valid, pages: 0 }],
        ['pages is negative', { ...valid, pages: -5 }],
        ['pages is not an integer', { ...valid, pages: 10.5 }],
        ['pages is a string', { ...valid, pages: '432' }],
        ['genre is empty', { ...valid, genre: '' }],
        ['genre is blank', { ...valid, genre: '   ' }],
        ['genre is not a string', { ...valid, genre: 42 }],
        ['status is sent', { ...valid, status: 'READ' }],
        [
          'id is sent',
          { ...valid, id: 'b1d4a1a2-0c54-4d6a-8d5e-2a2f4c9d1e11' },
        ],
        ['an unknown field is sent', { ...valid, rating: 5 }],
      ])('returns 400 when %s', async (_case, payload) => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/books')
          .send(payload)
          .expect(400);

        const body = response.body as ErrorResponse;
        expect(body.statusCode).toBe(400);
        expect(body.error).toBe('Bad Request');
        expect(body.message).toBeDefined();
        expect(await bookRepository.count()).toBe(0);
      });
    });
  });

  describe('GET /api/v1/books', () => {
    it('returns 200 and an empty array when there are no books', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/books')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns all registered books', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          pages: 432,
          genre: 'Technology',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({ title: 'Dune', author: 'Frank Herbert' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/books')
        .expect(200);

      const books = response.body as BookResponse[];
      expect(books).toHaveLength(2);
      expect(books.map((book) => book.title).sort()).toEqual([
        'Clean Architecture',
        'Dune',
      ]);
      const cleanArchitecture = books.find(
        (book) => book.title === 'Clean Architecture',
      );
      expect(cleanArchitecture).toMatchObject({
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
        status: 'WANT_TO_READ',
      });
      expect(cleanArchitecture?.id).toMatch(UUID_REGEX);
      const dune = books.find((book) => book.title === 'Dune');
      expect(dune).toMatchObject({ pages: null, genre: null });
    });
  });
});
