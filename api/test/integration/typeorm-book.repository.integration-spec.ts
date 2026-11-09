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
});
