import { Book } from '../entities/book.entity';

export interface BookRepository {
  save(book: Book): Promise<Book>;
  findAll(): Promise<Book[]>;
  findById(id: string): Promise<Book | null>;
}

export const BOOK_REPOSITORY = Symbol('BOOK_REPOSITORY');
