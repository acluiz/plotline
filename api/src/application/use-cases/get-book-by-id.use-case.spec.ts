import { Book } from '../../domain/entities/book.entity';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import { BookRepository } from '../../domain/repositories/book.repository';
import { ReadingStatus } from '../../domain/vo/reading-status';
import { GetBookByIdUseCase } from './get-book-by-id.use-case';

describe('GetBookByIdUseCase', () => {
  let findById: jest.Mock<Promise<Book | null>, [string]>;
  let useCase: GetBookByIdUseCase;

  beforeEach(() => {
    findById = jest.fn<Promise<Book | null>, [string]>();
    const repository: BookRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById,
      delete: jest.fn(),
    };
    useCase = new GetBookByIdUseCase(repository);
  });

  it('returns the book found by id mapped to output', async () => {
    const book = Book.create({
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      pages: 432,
      genre: 'Technology',
    });
    findById.mockResolvedValue(book);

    const output = await useCase.execute(book.id);

    expect(findById).toHaveBeenCalledWith(book.id);
    expect(output).toEqual({
      id: book.id,
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      pages: 432,
      genre: 'Technology',
      status: ReadingStatus.WANT_TO_READ,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    });
  });

  it('throws BookNotFoundException when the book does not exist', async () => {
    findById.mockResolvedValue(null);
    const id = '3f8c1e5a-6d2b-4b7e-9a41-0c5d7e2f9b10';

    await expect(useCase.execute(id)).rejects.toThrow(BookNotFoundException);
    await expect(useCase.execute(id)).rejects.toThrow(
      `Book with id ${id} not found`,
    );
  });

  it('propagates repository failures', async () => {
    findById.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute('any-id')).rejects.toThrow('db down');
  });
});
