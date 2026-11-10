import { randomUUID } from 'node:crypto';
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
  describe('GET /api/v1/books/:id', () => {
    it('returns 200 and the book details', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          pages: 432,
          genre: 'Technology',
        })
        .expect(201);
      const { id } = created.body as BookResponse;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/books/${id}`)
        .expect(200);

      expect(response.body).toEqual(created.body);
    });

    it('returns null for optional fields that were not provided', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({ title: 'Dune', author: 'Frank Herbert' })
        .expect(201);
      const { id } = created.body as BookResponse;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/books/${id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id,
        pages: null,
        genre: null,
        status: 'WANT_TO_READ',
      });
    });

    it('returns 404 when the book does not exist', async () => {
      const id = randomUUID();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/books/${id}`)
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(404);
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe(`Book with id ${id} not found`);
    });

    it.each(['not-a-uuid', '123', 'abc-def'])(
      'returns 400 when the id %p is not a valid UUID',
      async (id) => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/books/${id}`)
          .expect(400);

        const body = response.body as ErrorResponse;
        expect(body.statusCode).toBe(400);
        expect(body.error).toBe('Bad Request');
      },
    );
  });
  describe('PATCH /api/v1/books/:id', () => {
    async function createBook(): Promise<BookResponse> {
      const response = await request(app.getHttpServer())
        .post('/api/v1/books')
        .send({
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          pages: 432,
          genre: 'Technology',
        })
        .expect(201);
      return response.body as BookResponse;
    }

    it('updates all descriptive fields and returns 200', async () => {
      const created = await createBook();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/books/${created.id}`)
        .send({
          title: "Clean Architecture: A Craftsman's Guide",
          author: 'Robert C. Martin',
          pages: 450,
          genre: 'Software Engineering',
        })
        .expect(200);

      const body = response.body as BookResponse;
      expect(body).toMatchObject({
        id: created.id,
        title: "Clean Architecture: A Craftsman's Guide",
        author: 'Robert C. Martin',
        pages: 450,
        genre: 'Software Engineering',
        status: 'WANT_TO_READ',
        createdAt: created.createdAt,
      });
      expect(Date.parse(body.updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(created.updatedAt),
      );
    });

    it('updates only the provided fields', async () => {
      const created = await createBook();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/books/${created.id}`)
        .send({ pages: 450 })
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.id,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 450,
        genre: 'Technology',
        status: 'WANT_TO_READ',
      });
    });

    it('persists the update in the database', async () => {
      const created = await createBook();

      await request(app.getHttpServer())
        .patch(`/api/v1/books/${created.id}`)
        .send({ title: 'Persisted title' })
        .expect(200);

      const row = await bookRepository.findOneByOrFail({ id: created.id });
      expect(row.title).toBe('Persisted title');
      expect(row.author).toBe('Robert C. Martin');
      expect(await bookRepository.count()).toBe(1);
    });

    it('does not change the reading status', async () => {
      const created = await createBook();
      await bookRepository.update({ id: created.id }, { status: 'READING' });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/books/${created.id}`)
        .send({ title: 'Another title' })
        .expect(200);

      expect((response.body as BookResponse).status).toBe('READING');
    });

    it('clears pages and genre when null is sent', async () => {
      const created = await createBook();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/books/${created.id}`)
        .send({ pages: null, genre: null })
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Clean Architecture',
        pages: null,
        genre: null,
      });
    });

    it('returns the book unchanged when the body is empty', async () => {
      const created = await createBook();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/books/${created.id}`)
        .send({})
        .expect(200);

      expect(response.body).toEqual(created);
    });

    it('returns 404 when the book does not exist', async () => {
      const id = randomUUID();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/books/${id}`)
        .send({ title: 'Does not matter' })
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(404);
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe(`Book with id ${id} not found`);
    });

    it('returns 400 when the id is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/books/not-a-uuid')
        .send({ title: 'Does not matter' })
        .expect(400);
    });

    describe('validation errors', () => {
      it.each([
        ['title is empty', { title: '' }],
        ['title is blank', { title: '   ' }],
        ['title is null', { title: null }],
        ['title is not a string', { title: 123 }],
        ['author is empty', { author: '' }],
        ['author is blank', { author: '   ' }],
        ['author is null', { author: null }],
        ['pages is zero', { pages: 0 }],
        ['pages is negative', { pages: -5 }],
        ['pages is not an integer', { pages: 10.5 }],
        ['pages is a string', { pages: '450' }],
        ['genre is empty', { genre: '' }],
        ['genre is blank', { genre: '   ' }],
        ['genre is not a string', { genre: 42 }],
        ['status is sent', { status: 'READ' }],
        ['id is sent', { id: 'b1d4a1a2-0c54-4d6a-8d5e-2a2f4c9d1e11' }],
        ['an unknown field is sent', { rating: 5 }],
        [
          'a valid field is sent with an invalid one',
          { title: 'New', pages: 0 },
        ],
      ])(
        'returns 400 when %s and leaves the book untouched',
        async (_case, payload) => {
          const created = await createBook();

          const response = await request(app.getHttpServer())
            .patch(`/api/v1/books/${created.id}`)
            .send(payload)
            .expect(400);

          const body = response.body as ErrorResponse;
          expect(body.statusCode).toBe(400);
          expect(body.error).toBe('Bad Request');

          const after = await request(app.getHttpServer())
            .get(`/api/v1/books/${created.id}`)
            .expect(200);
          expect(after.body).toEqual(created);
        },
      );
    });
  });
});
