import { InvalidBookException } from '../exceptions/invalid-book.exception';
import { ReadingStatus } from '../vo/reading-status';
import { Book } from './book.entity';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('Book', () => {
  describe('create', () => {
    it('creates a book with a generated UUID and WANT_TO_READ status', () => {
      const now = new Date('2026-01-01T10:00:00.000Z');

      const book = Book.create(
        {
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          pages: 432,
          genre: 'Technology',
        },
        now,
      );

      expect(book.id).toMatch(UUID_REGEX);
      expect(book.title).toBe('Clean Architecture');
      expect(book.author).toBe('Robert C. Martin');
      expect(book.pages).toBe(432);
      expect(book.genre).toBe('Technology');
      expect(book.status).toBe(ReadingStatus.WANT_TO_READ);
      expect(book.createdAt).toEqual(now);
      expect(book.updatedAt).toEqual(now);
    });

    it('sets optional fields to null when they are not provided', () => {
      const book = Book.create({ title: 'Dune', author: 'Frank Herbert' });

      expect(book.pages).toBeNull();
      expect(book.genre).toBeNull();
    });

    it('treats null optional fields as not provided', () => {
      const book = Book.create({
        title: 'Dune',
        author: 'Frank Herbert',
        pages: null,
        genre: null,
      });

      expect(book.pages).toBeNull();
      expect(book.genre).toBeNull();
    });

    it('trims title, author and genre', () => {
      const book = Book.create({
        title: '  Dune  ',
        author: ' Frank Herbert ',
        genre: ' Sci-Fi ',
      });

      expect(book.title).toBe('Dune');
      expect(book.author).toBe('Frank Herbert');
      expect(book.genre).toBe('Sci-Fi');
    });

    it('generates a different id for each book', () => {
      const first = Book.create({ title: 'A', author: 'B' });
      const second = Book.create({ title: 'A', author: 'B' });

      expect(first.id).not.toBe(second.id);
    });

    it.each([
      ['title is empty', { title: '', author: 'Author' }, 'title is required'],
      [
        'title is blank',
        { title: '   ', author: 'Author' },
        'title is required',
      ],
      ['author is empty', { title: 'Title', author: '' }, 'author is required'],
      [
        'author is blank',
        { title: 'Title', author: '   ' },
        'author is required',
      ],
      [
        'pages is zero',
        { title: 'Title', author: 'Author', pages: 0 },
        'pages must be a positive integer',
      ],
      [
        'pages is negative',
        { title: 'Title', author: 'Author', pages: -10 },
        'pages must be a positive integer',
      ],
      [
        'pages is not an integer',
        { title: 'Title', author: 'Author', pages: 10.5 },
        'pages must be a positive integer',
      ],
      [
        'genre is blank',
        { title: 'Title', author: 'Author', genre: '  ' },
        'genre must be a non-empty string',
      ],
    ])('rejects the book when %s', (_case, input, message) => {
      expect(() => Book.create(input)).toThrow(InvalidBookException);
      expect(() => Book.create(input)).toThrow(message);
    });
  });

  describe('restore', () => {
    it('rebuilds a book from persisted data without changing it', () => {
      const props = {
        id: '4f0b7a4e-8f0a-4d52-9d2f-5b6f3c1f2a10',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        pages: 464,
        genre: 'Technology',
        status: ReadingStatus.READING,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        updatedAt: new Date('2026-01-02T10:00:00.000Z'),
      };

      const book = Book.restore(props);

      expect(book.id).toBe(props.id);
      expect(book.title).toBe(props.title);
      expect(book.author).toBe(props.author);
      expect(book.pages).toBe(props.pages);
      expect(book.genre).toBe(props.genre);
      expect(book.status).toBe(ReadingStatus.READING);
      expect(book.createdAt).toEqual(props.createdAt);
      expect(book.updatedAt).toEqual(props.updatedAt);
    });
  });
  describe('update', () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z');
    const updatedAt = new Date('2026-02-01T10:00:00.000Z');

    function build(): Book {
      return Book.restore({
        id: '4f0b7a4e-8f0a-4d52-9d2f-5b6f3c1f2a10',
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        pages: 432,
        genre: 'Technology',
        status: ReadingStatus.READING,
        createdAt,
        updatedAt: createdAt,
      });
    }

    it('updates only the provided fields', () => {
      const book = build();

      book.update({ pages: 450 }, updatedAt);

      expect(book.pages).toBe(450);
      expect(book.title).toBe('Clean Architecture');
      expect(book.author).toBe('Robert C. Martin');
      expect(book.genre).toBe('Technology');
    });

    it('updates all descriptive fields and trims text', () => {
      const book = build();

      book.update(
        {
          title: "  Clean Architecture: A Craftsman's Guide ",
          author: ' Uncle Bob ',
          pages: 450,
          genre: ' Software Engineering ',
        },
        updatedAt,
      );

      expect(book.title).toBe("Clean Architecture: A Craftsman's Guide");
      expect(book.author).toBe('Uncle Bob');
      expect(book.pages).toBe(450);
      expect(book.genre).toBe('Software Engineering');
    });

    it('refreshes updatedAt and keeps id, status and createdAt', () => {
      const book = build();

      book.update({ title: 'New title' }, updatedAt);

      expect(book.updatedAt).toEqual(updatedAt);
      expect(book.createdAt).toEqual(createdAt);
      expect(book.id).toBe('4f0b7a4e-8f0a-4d52-9d2f-5b6f3c1f2a10');
      expect(book.status).toBe(ReadingStatus.READING);
    });

    it('clears pages and genre when null is provided', () => {
      const book = build();

      book.update({ pages: null, genre: null }, updatedAt);

      expect(book.pages).toBeNull();
      expect(book.genre).toBeNull();
      expect(book.title).toBe('Clean Architecture');
    });

    it('does nothing when no field is provided', () => {
      const book = build();

      book.update({}, updatedAt);

      expect(book.updatedAt).toEqual(createdAt);
      expect(book.title).toBe('Clean Architecture');
    });

    it.each([
      ['title is blank', { title: '  ' }, 'title is required'],
      ['title is null', { title: null }, 'title is required'],
      ['author is blank', { author: '' }, 'author is required'],
      ['author is null', { author: null }, 'author is required'],
      ['pages is zero', { pages: 0 }, 'pages must be a positive integer'],
      ['pages is negative', { pages: -1 }, 'pages must be a positive integer'],
      [
        'pages is not an integer',
        { pages: 1.5 },
        'pages must be a positive integer',
      ],
      ['genre is blank', { genre: ' ' }, 'genre must be a non-empty string'],
    ])('rejects the update when %s', (_case, changes, message) => {
      const book = build();

      expect(() => book.update(changes as never, updatedAt)).toThrow(
        InvalidBookException,
      );
      expect(() => book.update(changes as never, updatedAt)).toThrow(message);
    });

    it('changes nothing when any provided field is invalid', () => {
      const book = build();

      expect(() =>
        book.update({ title: 'Valid new title', pages: -1 }, updatedAt),
      ).toThrow(InvalidBookException);

      expect(book.title).toBe('Clean Architecture');
      expect(book.pages).toBe(432);
      expect(book.updatedAt).toEqual(createdAt);
    });
  });
});
