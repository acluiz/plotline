import { Inject, Injectable } from '@nestjs/common';
import { Book } from '../../domain/entities/book.entity';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/repositories/book.repository';
import { BookOutput, toBookOutput } from '../dto/book.output';

export interface CreateBookInput {
  title: string;
  author: string;
  pages?: number | null;
  genre?: string | null;
}

@Injectable()
export class CreateBookUseCase {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: BookRepository,
  ) {}

  async execute(input: CreateBookInput): Promise<BookOutput> {
    const book = Book.create(input);
    const saved = await this.bookRepository.save(book);

    return toBookOutput(saved);
  }
}
