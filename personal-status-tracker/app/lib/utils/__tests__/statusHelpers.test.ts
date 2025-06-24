import {
  getHydrationStatus,
  getMoodLevel,
  getAltitudeColor,
  getAltitudeEmoji,
  validateAltitude
} from '../statusHelpers';
import { HydrationStatus, MoodLevel, ALTITUDE_CONFIG } from '@/app/types/status';
import { ALTITUDE_COLORS } from '@/app/lib/constants';

describe('statusHelpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getHydrationStatus', () => {
    it('should return NO_DATA for empty string', () => {
      expect(getHydrationStatus('')).toBe(HydrationStatus.NO_DATA);
    });

    it('should return WELL_HYDRATED for recent water intake', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000).toISOString();
      expect(getHydrationStatus(thirtyMinutesAgo)).toBe(HydrationStatus.WELL_HYDRATED);
    });

    it('should return GOOD for 2 hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      expect(getHydrationStatus(twoHoursAgo)).toBe(HydrationStatus.GOOD);
    });

    it('should return TIME_FOR_WATER for 4 hours ago', () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 3600000).toISOString();
      expect(getHydrationStatus(fourHoursAgo)).toBe(HydrationStatus.TIME_FOR_WATER);
    });

    it('should return DEHYDRATED for 8 hours ago', () => {
      const eightHoursAgo = new Date(Date.now() - 8 * 3600000).toISOString();
      expect(getHydrationStatus(eightHoursAgo)).toBe(HydrationStatus.DEHYDRATED);
    });
  });

  describe('getMoodLevel', () => {
    it('should return EXCELLENT for altitude >= 8', () => {
      expect(getMoodLevel(8)).toBe(MoodLevel.EXCELLENT);
      expect(getMoodLevel(9)).toBe(MoodLevel.EXCELLENT);
      expect(getMoodLevel(10)).toBe(MoodLevel.EXCELLENT);
    });

    it('should return GOOD for altitude 6-7', () => {
      expect(getMoodLevel(6)).toBe(MoodLevel.GOOD);
      expect(getMoodLevel(7)).toBe(MoodLevel.GOOD);
    });

    it('should return FAIR for altitude 4-5', () => {
      expect(getMoodLevel(4)).toBe(MoodLevel.FAIR);
      expect(getMoodLevel(5)).toBe(MoodLevel.FAIR);
    });

    it('should return LOW for altitude < 4', () => {
      expect(getMoodLevel(1)).toBe(MoodLevel.LOW);
      expect(getMoodLevel(2)).toBe(MoodLevel.LOW);
      expect(getMoodLevel(3)).toBe(MoodLevel.LOW);
    });
  });

  describe('getAltitudeColor', () => {
    it('should return correct colors for different altitudes', () => {
      expect(getAltitudeColor(10)).toBe(ALTITUDE_COLORS.EXCELLENT);
      expect(getAltitudeColor(7)).toBe(ALTITUDE_COLORS.GOOD);
      expect(getAltitudeColor(5)).toBe(ALTITUDE_COLORS.FAIR);
      expect(getAltitudeColor(2)).toBe(ALTITUDE_COLORS.LOW);
    });
  });

  describe('getAltitudeEmoji', () => {
    it('should return correct emojis for different altitudes', () => {
      expect(getAltitudeEmoji(10)).toBe('🚀');
      expect(getAltitudeEmoji(9)).toBe('🚀');
      expect(getAltitudeEmoji(8)).toBe('✈️');
      expect(getAltitudeEmoji(7)).toBe('✈️');
      expect(getAltitudeEmoji(6)).toBe('🎈');
      expect(getAltitudeEmoji(5)).toBe('🎈');
      expect(getAltitudeEmoji(4)).toBe('🪂');
      expect(getAltitudeEmoji(3)).toBe('🪂');
      expect(getAltitudeEmoji(2)).toBe('🏊');
      expect(getAltitudeEmoji(1)).toBe('🏊');
    });
  });

  describe('validateAltitude', () => {
    it('should return value within valid range', () => {
      expect(validateAltitude(5)).toBe(5);
      expect(validateAltitude(1)).toBe(1);
      expect(validateAltitude(10)).toBe(10);
    });

    it('should clamp values below minimum', () => {
      expect(validateAltitude(0)).toBe(ALTITUDE_CONFIG.MIN);
      expect(validateAltitude(-5)).toBe(ALTITUDE_CONFIG.MIN);
    });

    it('should clamp values above maximum', () => {
      expect(validateAltitude(11)).toBe(ALTITUDE_CONFIG.MAX);
      expect(validateAltitude(100)).toBe(ALTITUDE_CONFIG.MAX);
    });
  });
});