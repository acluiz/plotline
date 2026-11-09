import { Book } from '../../domain/entities/book.entity';
import { ReadingStatus } from '../../domain/vo/reading-status';

export interface BookOutput {
  id: string;
  title: string;
  author: string;
  pages: number | null;
  genre: string | null;
  status: ReadingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toBookOutput(book: Book): BookOutput {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    pages: book.pages,
    genre: book.genre,
    status: book.status,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}
