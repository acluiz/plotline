import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { BookOutput } from '../dto/book.output';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookStatusDto } from '../dto/update-book-status.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

import { CreateBookUseCase } from '../use-cases/create-book.use-case';
import { DeleteBookUseCase } from '../use-cases/delete-book.use-case';
import { GetBookByIdUseCase } from '../use-cases/get-book-by-id.use-case';
import { ListBooksUseCase } from '../use-cases/list-books.use-case';
import { UpdateBookStatusUseCase } from '../use-cases/update-book-status.use-case';
import { UpdateBookUseCase } from '../use-cases/update-book.use-case';

@Controller('books')
export class BooksController {
  constructor(
    private readonly listBooksUseCase: ListBooksUseCase,
    private readonly getBookByIdUseCase: GetBookByIdUseCase,
    private readonly updateBookUseCase: UpdateBookUseCase,
    private readonly updateBookStatusUseCase: UpdateBookStatusUseCase,
    private readonly deleteBookUseCase: DeleteBookUseCase,
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

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookDto,
  ): Promise<BookOutput> {
    return this.updateBookUseCase.execute(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookStatusDto,
  ): Promise<BookOutput> {
    return this.updateBookStatusUseCase.execute(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteBookUseCase.execute(id);
  }
}
