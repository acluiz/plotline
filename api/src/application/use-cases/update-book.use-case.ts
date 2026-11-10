import { Inject, Injectable } from '@nestjs/common';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/repositories/book.repository';
import { BookOutput, toBookOutput } from '../dto/book.output';

export interface UpdateBookInput {
  title?: string;
  author?: string;
  pages?: number | null;
  genre?: string | null;
}

@Injectable()
export class UpdateBookUseCase {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: BookRepository,
  ) {}

  async execute(id: string, input: UpdateBookInput): Promise<BookOutput> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new BookNotFoundException(id);
    }

    book.update(input);
    const saved = await this.bookRepository.save(book);
    return toBookOutput(saved);
  }
}
