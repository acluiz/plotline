import { isReadingStatus, ReadingStatus } from './reading-status';

describe('ReadingStatus', () => {
  it.each(['WANT_TO_READ', 'READING', 'READ'])('accepts %s', (value) => {
    expect(isReadingStatus(value)).toBe(true);
  });

  it.each(['reading', 'DONE', '', null, undefined, 1])(
    'rejects %p',
    (value) => {
      expect(isReadingStatus(value)).toBe(false);
    },
  );

  it('exposes the three allowed values', () => {
    expect(Object.values(ReadingStatus)).toEqual([
      'WANT_TO_READ',
      'READING',
      'READ',
    ]);
  });
});
