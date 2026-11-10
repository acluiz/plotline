import { Book } from '../../domain/entities/book.entity';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import { InvalidBookException } from '../../domain/exceptions/invalid-book.exception';
import { BookRepository } from '../../domain/repositories/book.repository';
import { ReadingStatus } from '../../domain/vo/reading-status';
import { UpdateBookStatusUseCase } from './update-book-status.use-case';

describe('UpdateBookStatusUseCase', () => {
  let findById: jest.Mock<Promise<Book | null>, [string]>;
  let save: jest.Mock<Promise<Book>, [Book]>;
  let useCase: UpdateBookStatusUseCase;
  let book: Book;

  beforeEach(() => {
    book = Book.create(
      {
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
      },
      new Date('2026-01-01T10:00:00.000Z'),
    );
    findById = jest
      .fn<Promise<Book | null>, [string]>()
      .mockResolvedValue(book);
    save = jest.fn((saved: Book) => Promise.resolve(saved));
    const repository: BookRepository = {
      save,
      findAll: jest.fn(),
      findById,
      delete: jest.fn(),
    };
    useCase = new UpdateBookStatusUseCase(repository);
  });

  it.each([
    ReadingStatus.READING,
    ReadingStatus.READ,
    ReadingStatus.WANT_TO_READ,
  ])('changes the status to %s and persists the book', async (status) => {
    const output = await useCase.execute(book.id, status);

    expect(findById).toHaveBeenCalledWith(book.id);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(book);
    expect(output).toMatchObject({
      id: book.id,
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      pages: 432,
      genre: 'Technology',
      status,
    });
  });

  it('refreshes updatedAt', async () => {
    const output = await useCase.execute(book.id, ReadingStatus.READ);

    expect(output.updatedAt.getTime()).toBeGreaterThan(
      output.createdAt.getTime(),
    );
  });

  it('throws BookNotFoundException and saves nothing when the book does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        '3f8c1e5a-6d2b-4b7e-9a41-0c5d7e2f9b10',
        ReadingStatus.READ,
      ),
    ).rejects.toThrow(BookNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('does not persist anything when the status is invalid', async () => {
    await expect(useCase.execute(book.id, 'DONE' as never)).rejects.toThrow(
      InvalidBookException,
    );

    expect(save).not.toHaveBeenCalled();
    expect(book.status).toBe(ReadingStatus.WANT_TO_READ);
  });

  it('propagates repository failures', async () => {
    save.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute(book.id, ReadingStatus.READ)).rejects.toThrow(
      'db down',
    );
  });
});
