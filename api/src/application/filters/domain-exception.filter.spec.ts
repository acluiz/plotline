import { ArgumentsHost } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { BookNotFoundException } from '../../domain/exceptions/book-not-found.exception';
import { InvalidBookException } from '../../domain/exceptions/invalid-book.exception';
import { DomainExceptionFilter } from './domain-exception.filter';

class UnmappedDomainException extends DomainException {}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  function run(exception: DomainException) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    return { status, json };
  }

  it('maps InvalidBookException to 400 Bad Request', () => {
    const { status, json } = run(new InvalidBookException('title is required'));

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'title is required',
      error: 'Bad Request',
    });
  });

  it('maps BookNotFoundException to 404 Not Found', () => {
    const { status, json } = run(new BookNotFoundException('abc'));

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Book with id abc not found',
      error: 'Not Found',
    });
  });

  it('maps unknown domain exceptions to 500 without leaking details', () => {
    const { status, json } = run(new UnmappedDomainException('secret'));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  });
});
