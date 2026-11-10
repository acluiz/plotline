import { Book } from '../../domain/entities/book.entity';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import { InvalidBookException } from '../../domain/exceptions/invalid-book.exception';
import { BookRepository } from '../../domain/repositories/book.repository';
import { ReadingStatus } from '../../domain/vo/reading-status';
import { UpdateBookUseCase } from './update-book.use-case';

describe('UpdateBookUseCase', () => {
  let findById: jest.Mock<Promise<Book | null>, [string]>;
  let save: jest.Mock<Promise<Book>, [Book]>;
  let useCase: UpdateBookUseCase;
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
    useCase = new UpdateBookUseCase(repository);
  });

  it('updates only the provided fields and persists the book', async () => {
    const output = await useCase.execute(book.id, { pages: 450 });

    expect(findById).toHaveBeenCalledWith(book.id);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(book);
    expect(output).toMatchObject({
      id: book.id,
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      pages: 450,
      genre: 'Technology',
      status: ReadingStatus.WANT_TO_READ,
    });
  });

  it('updates all descriptive fields', async () => {
    const output = await useCase.execute(book.id, {
      title: "Clean Architecture: A Craftsman's Guide",
      author: 'Uncle Bob',
      pages: 450,
      genre: 'Software Engineering',
    });

    expect(output).toMatchObject({
      title: "Clean Architecture: A Craftsman's Guide",
      author: 'Uncle Bob',
      pages: 450,
      genre: 'Software Engineering',
    });
    expect(output.updatedAt.getTime()).toBeGreaterThan(
      output.createdAt.getTime(),
    );
  });

  it('throws BookNotFoundException and saves nothing when the book does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute('3f8c1e5a-6d2b-4b7e-9a41-0c5d7e2f9b10', { pages: 10 }),
    ).rejects.toThrow(BookNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('does not persist anything when the changes are invalid', async () => {
    await expect(useCase.execute(book.id, { pages: -1 })).rejects.toThrow(
      InvalidBookException,
    );

    expect(save).not.toHaveBeenCalled();
    expect(book.pages).toBe(432);
  });

  it('propagates repository failures', async () => {
    save.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute(book.id, { pages: 450 })).rejects.toThrow(
      'db down',
    );
  });
});
