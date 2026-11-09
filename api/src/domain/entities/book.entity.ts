import { randomUUID } from 'node:crypto';
import { InvalidBookException } from '../exceptions/invalid-book.exception';
import { ReadingStatus } from '../vo/reading-status';

export interface CreateBookProps {
  title: string;
  author: string;
  pages?: number | null;
  genre?: string | null;
}

export interface BookProps {
  id: string;
  title: string;
  author: string;
  pages: number | null;
  genre: string | null;
  status: ReadingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Book {
  private constructor(private readonly props: BookProps) {}

  static create(input: CreateBookProps, now: Date = new Date()): Book {
    return new Book({
      id: randomUUID(),
      title: requireText('title', input.title),
      author: requireText('author', input.author),
      pages: normalizePages(input.pages),
      genre: normalizeGenre(input.genre),
      status: ReadingStatus.WANT_TO_READ,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds a Book from persisted data, without generating new values. */
  static restore(props: BookProps): Book {
    return new Book({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get author(): string {
    return this.props.author;
  }

  get pages(): number | null {
    return this.props.pages;
  }

  get genre(): string | null {
    return this.props.genre;
  }

  get status(): ReadingStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function requireText(field: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidBookException(`${field} is required`);
  }
  return value.trim();
}

function normalizePages(value?: number | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvalidBookException('pages must be a positive integer');
  }
  return value;
}

function normalizeGenre(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidBookException('genre must be a non-empty string');
  }
  return value.trim();
}
