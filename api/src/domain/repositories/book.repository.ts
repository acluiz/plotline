import { Book } from '../entities/book.entity';

export interface BookRepository {
  save(book: Book): Promise<Book>;
  findAll(): Promise<Book[]>;
  findById(id: string): Promise<Book | null>;
  /** Removes the book. Resolves to `false` when no book has the given id. */
  delete(id: string): Promise<boolean>;
}

export const BOOK_REPOSITORY = Symbol('BOOK_REPOSITORY');
