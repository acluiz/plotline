import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import { BookRepository } from '../../domain/repositories/book.repository';
import { DeleteBookUseCase } from './delete-book.use-case';

describe('DeleteBookUseCase', () => {
  const id = '3f8c1e5a-6d2b-4b7e-9a41-0c5d7e2f9b10';
  let remove: jest.Mock<Promise<boolean>, [string]>;
  let useCase: DeleteBookUseCase;

  beforeEach(() => {
    remove = jest.fn<Promise<boolean>, [string]>();
    const repository: BookRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: remove,
    };
    useCase = new DeleteBookUseCase(repository);
  });

  it('removes the book and returns nothing', async () => {
    remove.mockResolvedValue(true);

    await expect(useCase.execute(id)).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(id);
  });

  it('throws BookNotFoundException when the book does not exist', async () => {
    remove.mockResolvedValue(false);

    await expect(useCase.execute(id)).rejects.toThrow(BookNotFoundException);
    await expect(useCase.execute(id)).rejects.toThrow(
      `Book with id ${id} not found`,
    );
  });

  it('propagates repository failures', async () => {
    remove.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute(id)).rejects.toThrow('db down');
  });
});
