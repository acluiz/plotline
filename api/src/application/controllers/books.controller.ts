import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { BookOutput } from '../dto/book.output';
import { CreateBookDto } from '../dto/create-book.dto';

import { CreateBookUseCase } from '../use-cases/create-book.use-case';
import { GetBookByIdUseCase } from '../use-cases/get-book-by-id.use-case';
import { ListBooksUseCase } from '../use-cases/list-books.use-case';

@Controller('books')
export class BooksController {
  constructor(
    private readonly listBooksUseCase: ListBooksUseCase,
    private readonly getBookByIdUseCase: GetBookByIdUseCase,
    private readonly createBookUseCase: CreateBookUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBookDto): Promise<BookOutput> {
    return this.createBookUseCase.execute(dto);
  }

  @Get()
  list(): Promise<BookOutput[]> {
    return this.listBooksUseCase.execute();
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<BookOutput> {
    return this.getBookByIdUseCase.execute(id);
  }
}
