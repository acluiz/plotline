import { DataSource, Repository } from 'typeorm';
import { Book } from '../../src/domain/entities/book.entity';
import { ReadingStatus } from '../../src/domain/vo/reading-status';
import { BookOrmEntity } from '../../src/infrastructure/entities/book.orm-entity';
import { TypeOrmBookRepository } from '../../src/infrastructure/repositories/typeorm-book.repository';
import { prepareTestDatabase } from '../support/test-database';

describe('TypeOrmBookRepository (integration)', () => {
  let dataSource: DataSource;
  let ormRepository: Repository<BookOrmEntity>;
  let repository: TypeOrmBookRepository;

  beforeAll(async () => {
    dataSource = await prepareTestDatabase();
    ormRepository = dataSource.getRepository(BookOrmEntity);
    repository = new TypeOrmBookRepository(ormRepository);
  });

  beforeEach(async () => {
    await ormRepository.clear();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('save', () => {
    it('persists a new book and returns it as a domain entity', async () => {
      const book = Book.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
      });

      const saved = await repository.save(book);

      expect(saved).toBeInstanceOf(Book);
      expect(saved.id).toBe(book.id);

      const row = await ormRepository.findOneByOrFail({ id: book.id });
      expect(row).toMatchObject({
        id: book.id,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
        status: 'WANT_TO_READ',
      });
      expect(row.createdAt).toEqual(book.createdAt);
      expect(row.updatedAt).toEqual(book.updatedAt);
    });

    it('stores optional fields as null', async () => {
      const book = Book.create({ title: 'Dune', author: 'Frank Herbert' });

      const saved = await repository.save(book);

      expect(saved.pages).toBeNull();
      expect(saved.genre).toBeNull();
      const row = await ormRepository.findOneByOrFail({ id: book.id });
      expect(row.pages).toBeNull();
      expect(row.genre).toBeNull();
    });

    it('persists the reading status', async () => {
      const book = Book.create({ title: 'Dune', author: 'Frank Herbert' });

      const saved = await repository.save(book);

      expect(saved.status).toBe(ReadingStatus.WANT_TO_READ);
    });
  });
  describe('findAll', () => {
    it('returns an empty array when there are no books', async () => {
      await expect(repository.findAll()).resolves.toEqual([]);
    });

    it('returns all books as domain entities ordered by creation date', async () => {
      const oldest = Book.create(
        { title: 'Oldest', author: 'Author' },
        new Date('2026-01-01T10:00:00.000Z'),
      );
      const middle = Book.create(
        { title: 'Middle', author: 'Author', pages: 100, genre: 'Fiction' },
        new Date('2026-01-02T10:00:00.000Z'),
      );
      const newest = Book.create(
        { title: 'Newest', author: 'Author' },
        new Date('2026-01-03T10:00:00.000Z'),
      );
      await repository.save(newest);
      await repository.save(oldest);
      await repository.save(middle);

      const books = await repository.findAll();

      expect(books).toHaveLength(3);
      books.forEach((book) => expect(book).toBeInstanceOf(Book));
      expect(books.map((book) => book.title)).toEqual([
        'Oldest',
        'Middle',
        'Newest',
      ]);
      expect(books[1]).toMatchObject({
        id: middle.id,
        pages: 100,
        genre: 'Fiction',
        status: ReadingStatus.WANT_TO_READ,
      });
    });
  });
  describe('findById', () => {
    it('returns the book as a domain entity when it exists', async () => {
      const book = Book.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
      });
      await repository.save(book);

      const found = await repository.findById(book.id);

      expect(found).toBeInstanceOf(Book);
      expect(found).toMatchObject({
        id: book.id,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
        status: ReadingStatus.WANT_TO_READ,
      });
      expect(found?.createdAt).toEqual(book.createdAt);
      expect(found?.updatedAt).toEqual(book.updatedAt);
    });

    it('returns null when the book does not exist', async () => {
      await expect(
        repository.findById('3f8c1e5a-6d2b-4b7e-9a41-0c5d7e2f9b10'),
      ).resolves.toBeNull();
    });
  });
});
