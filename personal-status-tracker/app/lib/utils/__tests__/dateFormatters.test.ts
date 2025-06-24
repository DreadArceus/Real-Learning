import { formatTimeAgo, calculateHoursSince, formatDateTime } from '../dateFormatters';

describe('dateFormatters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatTimeAgo', () => {
    it('should return "Never" for empty string', () => {
      expect(formatTimeAgo('')).toBe('Never');
    });

    it('should return "Just now" for times less than 1 minute', () => {
      const now = new Date();
      expect(formatTimeAgo(now.toISOString())).toBe('Just now');
      
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      expect(formatTimeAgo(thirtySecondsAgo.toISOString())).toBe('Just now');
    });

    it('should format minutes correctly', () => {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      expect(formatTimeAgo(oneMinuteAgo.toISOString())).toBe('1 minute ago');
      
      const fiveMinutesAgo = new Date(Date.now() - 300000);
      expect(formatTimeAgo(fiveMinutesAgo.toISOString())).toBe('5 minutes ago');
      
      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60000);
      expect(formatTimeAgo(fiftyNineMinutesAgo.toISOString())).toBe('59 minutes ago');
    });

    it('should format hours correctly', () => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      expect(formatTimeAgo(oneHourAgo.toISOString())).toBe('1 hour ago');
      
      const twelveHoursAgo = new Date(Date.now() - 12 * 3600000);
      expect(formatTimeAgo(twelveHoursAgo.toISOString())).toBe('12 hours ago');
      
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 3600000);
      expect(formatTimeAgo(twentyThreeHoursAgo.toISOString())).toBe('23 hours ago');
    });

    it('should format days correctly', () => {
      const oneDayAgo = new Date(Date.now() - 86400000);
      expect(formatTimeAgo(oneDayAgo.toISOString())).toBe('1 day ago');
      
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
      expect(formatTimeAgo(threeDaysAgo.toISOString())).toBe('3 days ago');
    });

    it('should handle invalid date strings', () => {
      expect(formatTimeAgo('invalid-date')).toBe('Invalid date');
      expect(formatTimeAgo('2024-13-45')).toBe('Invalid date');
    });

    it('should handle future dates', () => {
      const futureDate = new Date(Date.now() + 3600000);
      expect(formatTimeAgo(futureDate.toISOString())).toBe('Invalid date');
    });
  });

  describe('calculateHoursSince', () => {
    it('should return Infinity for empty string', () => {
      expect(calculateHoursSince('')).toBe(Infinity);
    });

    it('should calculate hours correctly', () => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      expect(calculateHoursSince(oneHourAgo.toISOString())).toBeCloseTo(1, 5);
      
      const twoAndHalfHoursAgo = new Date(Date.now() - 2.5 * 3600000);
      expect(calculateHoursSince(twoAndHalfHoursAgo.toISOString())).toBeCloseTo(2.5, 5);
    });

    it('should handle invalid date strings', () => {
      expect(calculateHoursSince('invalid-date')).toBe(Infinity);
    });
  });

  describe('formatDateTime', () => {
    it('should return empty string for empty input', () => {
      expect(formatDateTime('')).toBe('');
    });

    it('should format valid date correctly', () => {
      const date = '2024-01-15T12:00:00Z';
      const result = formatDateTime(date);
      expect(result).toContain('2024');
      expect(result).toContain('1/15/2024'); // US locale format
    });

    it('should handle invalid date strings', () => {
      expect(formatDateTime('invalid-date')).toBe('Invalid date');
    });
  });
});