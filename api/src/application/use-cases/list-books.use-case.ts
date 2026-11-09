import { Inject, Injectable } from '@nestjs/common';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/repositories/book.repository';
import { BookOutput, toBookOutput } from '../dto/book.output';

@Injectable()
export class ListBooksUseCase {
  constructor(
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: BookRepository,
  ) {}

  async execute(): Promise<BookOutput[]> {
    const books = await this.bookRepository.findAll();
    return books.map((book) => toBookOutput(book));
  }
}
