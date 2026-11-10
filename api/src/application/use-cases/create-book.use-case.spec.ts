import { Book } from '../../domain/entities/book.entity';
import { InvalidBookException } from '../../domain/exceptions/invalid-book.exception';
import { BookRepository } from '../../domain/repositories/book.repository';
import { ReadingStatus } from '../../domain/vo/reading-status';
import { CreateBookUseCase } from './create-book.use-case';

describe('CreateBookUseCase', () => {
  let save: jest.Mock<Promise<Book>, [Book]>;
  let useCase: CreateBookUseCase;

  beforeEach(() => {
    save = jest.fn((book: Book) => Promise.resolve(book));
    const repository: BookRepository = {
      save,
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CreateBookUseCase(repository);
  });

  it('creates and persists a book with WANT_TO_READ status', async () => {
    const output = await useCase.execute({
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      pages: 432,
      genre: 'Technology',
    });

    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0];
    expect(saved).toBeInstanceOf(Book);
    expect(saved.title).toBe('Clean Architecture');

    expect(output).toEqual({
      id: saved.id,
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      pages: 432,
      genre: 'Technology',
      status: ReadingStatus.WANT_TO_READ,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  });

  it('returns null for optional fields that were not provided', async () => {
    const output = await useCase.execute({
      title: 'Dune',
      author: 'Frank Herbert',
    });

    expect(output.pages).toBeNull();
    expect(output.genre).toBeNull();
  });

  it('returns what the repository saved', async () => {
    const persisted = Book.create({ title: 'Persisted', author: 'Repo' });
    save.mockResolvedValueOnce(persisted);

    const output = await useCase.execute({ title: 'Input', author: 'Input' });

    expect(output.id).toBe(persisted.id);
    expect(output.title).toBe('Persisted');
  });

  it('does not persist anything when the book is invalid', async () => {
    await expect(
      useCase.execute({ title: ' ', author: 'Someone' }),
    ).rejects.toThrow(InvalidBookException);

    expect(save).not.toHaveBeenCalled();
  });

  it('propagates repository failures', async () => {
    save.mockRejectedValueOnce(new Error('db down'));

    await expect(
      useCase.execute({ title: 'Dune', author: 'Frank Herbert' }),
    ).rejects.toThrow('db down');
  });
});
