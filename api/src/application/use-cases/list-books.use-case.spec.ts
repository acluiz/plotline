import { Book } from '../../domain/entities/book.entity';
import { BookRepository } from '../../domain/repositories/book.repository';
import { ReadingStatus } from '../../domain/vo/reading-status';
import { ListBooksUseCase } from './list-books.use-case';

describe('ListBooksUseCase', () => {
  let findAll: jest.Mock<Promise<Book[]>, []>;
  let useCase: ListBooksUseCase;

  beforeEach(() => {
    findAll = jest.fn<Promise<Book[]>, []>();
    const repository: BookRepository = {
      save: jest.fn(),
      findAll,
      findById: jest.fn(),
    };
    useCase = new ListBooksUseCase(repository);
  });

  it('returns an empty array when there are no books', async () => {
    findAll.mockResolvedValue([]);

    await expect(useCase.execute()).resolves.toEqual([]);
    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it('returns every book from the repository mapped to output', async () => {
    const first = Book.create({
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      pages: 432,
      genre: 'Technology',
    });
    const second = Book.create({ title: 'Dune', author: 'Frank Herbert' });
    findAll.mockResolvedValue([first, second]);

    const output = await useCase.execute();

    expect(output).toEqual([
      {
        id: first.id,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
        status: ReadingStatus.WANT_TO_READ,
        createdAt: first.createdAt,
        updatedAt: first.updatedAt,
      },
      {
        id: second.id,
        title: 'Dune',
        author: 'Frank Herbert',
        pages: null,
        genre: null,
        status: ReadingStatus.WANT_TO_READ,
        createdAt: second.createdAt,
        updatedAt: second.updatedAt,
      },
    ]);
  });

  it('propagates repository failures', async () => {
    findAll.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute()).rejects.toThrow('db down');
  });
});
